import type { ContributionStatus, Difficulty } from '@prisma/client';

// --- Types ---

export interface ContributionInput {
  status: ContributionStatus;
  difficulty: Difficulty;
  repoStars: number;
  startedAt: Date | string;
  mergedAt: Date | string | null;
}

export interface DCSBreakdown {
  mergeRate: number;       // 0-1000
  difficultyGrowth: number; // 0-1000
  repoCaliber: number;     // 0-1000
  consistency: number;     // 0-1000
}

export interface DCSResult {
  score: number;           // 0-1000
  level: string;
  breakdown: DCSBreakdown;
  totalFinished: number;
  totalMerged: number;
}

// --- Constants ---

const WEIGHTS = {
  mergeRate: 0.30,
  difficultyGrowth: 0.25,
  repoCaliber: 0.25,
  consistency: 0.20,
} as const;

const DIFFICULTY_WEIGHTS: Record<Difficulty, number> = {
  EASY: 1,
  MEDIUM: 3,
  HARD: 7,
};

const VOLUME_THRESHOLD = 10;
const CONSISTENCY_WEEKS = 12;
const MAX_SCORE = 1000;

const LEVELS = [
  { min: 0, label: 'Newcomer' },
  { min: 201, label: 'Explorer' },
  { min: 401, label: 'Contributor' },
  { min: 601, label: 'Advanced Contributor' },
  { min: 801, label: 'Elite Contributor' },
] as const;

// --- Helpers ---

function toDate(d: Date | string): Date {
  return d instanceof Date ? d : new Date(d);
}

function getLevel(score: number): string {
  for (let i = LEVELS.length - 1; i >= 0; i--) {
    if (score >= LEVELS[i].min) return LEVELS[i].label;
  }
  return LEVELS[0].label;
}

// --- Dimension Scorers ---

/**
 * M = Merge Rate Score
 * Formula: (merged / finished) * min(1, finished / VOLUME_THRESHOLD) * 1000
 *
 * Volume bonus prevents gaming: 1/1 (100%) shouldn't beat 15/20 (75%)
 * because the latter has proven consistency over a larger sample.
 */
function scoreMergeRate(merged: number, finished: number): number {
  if (finished === 0) return 0;

  const rate = merged / finished;
  const volumeBonus = Math.min(1, finished / VOLUME_THRESHOLD);

  return Math.round(rate * volumeBonus * MAX_SCORE);
}

/**
 * D = Difficulty Growth Score
 * Combines two signals:
 *   1. difficultyLevel (60%): What level are you at overall?
 *   2. growth (40%): Are your recent contributions harder than older ones?
 *
 * Weights: EASY=1, MEDIUM=3, HARD=7 (non-linear — Hard is much harder)
 * Max difficultyLevel achieved when overallAvg >= 5 (mostly Medium+Hard)
 * Max growth achieved when recent is 3x harder than older
 */
function scoreDifficultyGrowth(mergedContribs: ContributionInput[]): number {
  if (mergedContribs.length === 0) return 0;

  const weights = mergedContribs.map((c) => DIFFICULTY_WEIGHTS[c.difficulty]);
  const overallAvg = weights.reduce((a, b) => a + b, 0) / weights.length;

  // Difficulty level: how hard are your issues overall?
  // Normalized so that avg weight of 5 (Medium-Hard mix) = 1.0
  const difficultyLevel = Math.min(1, overallAvg / 5);

  if (mergedContribs.length < 2) {
    // Not enough data for growth comparison, use level only
    return Math.round(difficultyLevel * MAX_SCORE);
  }

  // Sort by date to split into older half and recent half
  const sorted = [...mergedContribs].sort(
    (a, b) => toDate(a.mergedAt!).getTime() - toDate(b.mergedAt!).getTime(),
  );
  const midpoint = Math.floor(sorted.length / 2);

  const olderWeights = sorted.slice(0, midpoint).map((c) => DIFFICULTY_WEIGHTS[c.difficulty]);
  const recentWeights = sorted.slice(midpoint).map((c) => DIFFICULTY_WEIGHTS[c.difficulty]);

  const olderAvg = olderWeights.reduce((a, b) => a + b, 0) / olderWeights.length;
  const recentAvg = recentWeights.reduce((a, b) => a + b, 0) / recentWeights.length;

  // Growth: ratio of recent difficulty to older difficulty
  // Capped at 3x for max score
  const growth = recentAvg / Math.max(olderAvg, 1);
  const growthNormalized = Math.min(1, growth / 3);

  const score = difficultyLevel * 0.6 + growthNormalized * 0.4;
  return Math.round(score * MAX_SCORE);
}

/**
 * R = Repo Caliber Score
 * Formula: avg(min(1, log10(stars) / 5)) * 1000
 *
 * Log scale because star counts are exponential:
 *   10 stars → 200, 100 → 400, 1K → 600, 10K → 800, 100K+ → 1000
 *
 * This is fair: contributing to a 1K-star repo is genuinely impressive,
 * even if facebook/react has 243K stars.
 */
function scoreRepoCaliber(mergedContribs: ContributionInput[]): number {
  if (mergedContribs.length === 0) return 0;

  const scores = mergedContribs.map((c) => {
    const logScore = Math.log10(Math.max(1, c.repoStars)) / 5;
    return Math.min(1, logScore);
  });

  const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
  return Math.round(avg * MAX_SCORE);
}

/**
 * C = Consistency Score
 * Formula: (activeWeeks / CONSISTENCY_WEEKS) * 1000
 *
 * Counts how many of the last 12 weeks had any contribution activity.
 * Any status counts (STARTED, PR_OPENED, PR_MERGED) — the point is
 * you showed up and worked.
 */
function scoreConsistency(contributions: ContributionInput[]): number {
  if (contributions.length === 0) return 0;

  const now = new Date();
  const twelveWeeksAgo = new Date(now);
  twelveWeeksAgo.setDate(twelveWeeksAgo.getDate() - CONSISTENCY_WEEKS * 7);

  // Get the Monday of each week for the last 12 weeks
  const activeWeeks = new Set<number>();

  for (const c of contributions) {
    const startDate = toDate(c.startedAt);
    if (startDate < twelveWeeksAgo) continue;

    // Calculate which week number (0-11) this falls into
    const daysSinceStart = Math.floor(
      (now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24),
    );
    const weekIndex = Math.floor(daysSinceStart / 7);

    if (weekIndex < CONSISTENCY_WEEKS) {
      activeWeeks.add(weekIndex);
    }
  }

  return Math.round((activeWeeks.size / CONSISTENCY_WEEKS) * MAX_SCORE);
}

// --- Main Calculator ---

/**
 * Calculates the Developer Contribution Score (DCS).
 *
 * DCS = 0.30(M) + 0.25(D) + 0.25(R) + 0.20(C)
 *
 * Where:
 *   M = Merge Rate (can you ship code that gets accepted?)
 *   D = Difficulty Growth (are you tackling harder problems over time?)
 *   R = Repo Caliber (where do you contribute? toy projects or real ones?)
 *   C = Consistency (do you show up regularly or just once?)
 *
 * @param contributions - Array of contribution data with status, difficulty, stars, and dates
 * @returns DCSResult with score, level, and per-dimension breakdown
 */
export function calculateDCS(contributions: ContributionInput[]): DCSResult {
  // Separate finished contributions (terminal states only)
  const finished = contributions.filter(
    (c) => c.status === 'PR_MERGED' || c.status === 'PR_CLOSED' || c.status === 'ABANDONED',
  );
  const merged = contributions.filter((c) => c.status === 'PR_MERGED');

  const totalFinished = finished.length;
  const totalMerged = merged.length;

  // Calculate each dimension
  const mergeRate = scoreMergeRate(totalMerged, totalFinished);
  const difficultyGrowth = scoreDifficultyGrowth(merged);
  const repoCaliber = scoreRepoCaliber(merged);
  const consistency = scoreConsistency(contributions);

  const breakdown: DCSBreakdown = { mergeRate, difficultyGrowth, repoCaliber, consistency };

  // Weighted sum
  const score = Math.round(
    mergeRate * WEIGHTS.mergeRate +
    difficultyGrowth * WEIGHTS.difficultyGrowth +
    repoCaliber * WEIGHTS.repoCaliber +
    consistency * WEIGHTS.consistency,
  );

  const clampedScore = Math.min(MAX_SCORE, Math.max(0, score));

  return {
    score: clampedScore,
    level: getLevel(clampedScore),
    breakdown,
    totalFinished,
    totalMerged,
  };
}
