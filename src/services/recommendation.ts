import prisma from '@/lib/db';
import { cacheGet, cacheSet } from '@/lib/redis';
import type { RecommendedIssue } from '@/types';
import type { SkillLevel, Difficulty } from '@/types';

const CACHE_TTL = 3600; // 1 hour

const DIFFICULTY_MAP: Record<SkillLevel, Difficulty[]> = {
  BEGINNER: ['EASY', 'MEDIUM'],
  INTERMEDIATE: ['EASY', 'MEDIUM', 'HARD'],
  ADVANCED: ['EASY', 'MEDIUM', 'HARD'],
};

const DIFFICULTY_SCORE: Record<string, Record<Difficulty, number>> = {
  BEGINNER: { EASY: 1.0, MEDIUM: 0.3, HARD: 0.0 },
  INTERMEDIATE: { EASY: 0.6, MEDIUM: 1.0, HARD: 0.4 },
  ADVANCED: { EASY: 0.3, MEDIUM: 0.7, HARD: 1.0 },
};

interface ScoringWeights {
  languageMatch: number;
  difficultyMatch: number;
  mergeProbability: number;
  repoHealth: number;
  freshness: number;
}

const DEFAULT_WEIGHTS: ScoringWeights = {
  languageMatch: 0.3,
  difficultyMatch: 0.25,
  mergeProbability: 0.2,
  repoHealth: 0.15,
  freshness: 0.1,
};

export async function getRecommendations(
  userId: string,
  count = 10,
): Promise<RecommendedIssue[]> {
  // Check cache first
  const cacheKey = `recommendations:${userId}`;
  const cached = await cacheGet<RecommendedIssue[]>(cacheKey);
  if (cached) return cached.slice(0, count);

  // Load user profile
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      skillLevel: true,
      preferredLanguages: true,
      contributions: {
        select: { issueId: true },
      },
    },
  });

  if (!user) return [];

  const excludedIssueIds = user.contributions.map((c) => c.issueId);
  const allowedDifficulties = DIFFICULTY_MAP[user.skillLevel];

  // Query candidate issues
  const candidates = await prisma.issue.findMany({
    where: {
      isOpen: true,
      isAssigned: false,
      difficulty: { in: allowedDifficulties },
      id: { notIn: excludedIssueIds },
      repository: { isActive: true },
    },
    include: {
      repository: {
        select: {
          fullName: true,
          owner: true,
          name: true,
          language: true,
          stars: true,
          healthScore: true,
        },
      },
    },
    take: 100, // Get a pool to score from
  });

  // Score each candidate
  const scored = candidates.map((issue) => {
    const repo = issue.repository;
    const score = calculateMatchScore(
      {
        language: repo.language,
        difficulty: issue.difficulty,
        mergeProbability: issue.mergeProbability,
        repoHealthScore: repo.healthScore,
        createdAt: issue.createdAtGithub,
      },
      {
        skillLevel: user.skillLevel,
        preferredLanguages: user.preferredLanguages,
      },
    );

    return {
      id: issue.id,
      title: issue.title,
      body: issue.body,
      number: issue.number,
      repoFullName: repo.fullName,
      repoOwner: repo.owner,
      repoName: repo.name,
      language: repo.language,
      stars: repo.stars,
      difficulty: issue.difficulty,
      mergeProbability: issue.mergeProbability,
      labels: issue.labels,
      commentCount: issue.commentCount,
      matchScore: score,
      createdAtGithub: issue.createdAtGithub.toISOString(),
    };
  });

  // Sort by match score descending
  scored.sort((a, b) => b.matchScore - a.matchScore);

  const results = scored.slice(0, count);

  // Only cache non-empty results — empty means issues haven't been synced yet
  if (results.length > 0) {
    await cacheSet(cacheKey, results, CACHE_TTL);
  }

  return results;
}

function calculateMatchScore(
  issue: {
    language: string | null;
    difficulty: Difficulty;
    mergeProbability: number;
    repoHealthScore: number;
    createdAt: Date;
  },
  user: {
    skillLevel: SkillLevel;
    preferredLanguages: string[];
  },
): number {
  const w = DEFAULT_WEIGHTS;

  // Language match (0 or 1)
  const languageScore =
    issue.language && user.preferredLanguages.length > 0
      ? user.preferredLanguages.some(
            (l) => l.toLowerCase() === issue.language!.toLowerCase(),
          )
          ? 1.0
          : 0.2
      : 0.5; // No preference = neutral

  // Difficulty match
  const difficultyScore = DIFFICULTY_SCORE[user.skillLevel]?.[issue.difficulty] ?? 0.5;

  // Merge probability (already 0-1)
  const mergeScore = issue.mergeProbability;

  // Repo health (normalize 0-100 to 0-1)
  const healthScore = issue.repoHealthScore / 100;

  // Freshness (newer = better)
  const daysSinceCreated = (Date.now() - issue.createdAt.getTime()) / (1000 * 60 * 60 * 24);
  const freshnessScore =
    daysSinceCreated < 7 ? 1.0 : daysSinceCreated < 30 ? 0.8 : daysSinceCreated < 90 ? 0.5 : 0.2;

  // Weighted composite
  const composite =
    w.languageMatch * languageScore +
    w.difficultyMatch * difficultyScore +
    w.mergeProbability * mergeScore +
    w.repoHealth * healthScore +
    w.freshness * freshnessScore;

  return Math.round(composite * 100) / 100;
}
