import type { Difficulty, SkillLevel, ContributionStatus, ScrapeStatus } from '@prisma/client';

export type { Difficulty, SkillLevel, ContributionStatus, ScrapeStatus };

export interface RecommendedIssue {
  id: string;
  title: string;
  body: string | null;
  number: number;
  repoFullName: string;
  repoOwner: string;
  repoName: string;
  language: string | null;
  stars: number;
  difficulty: Difficulty;
  mergeProbability: number;
  labels: string[];
  commentCount: number;
  matchScore: number;
  createdAtGithub: string;
}

export interface UserStats {
  totalContributions: number;
  mergedPRs: number;
  openPRs: number;
  successRate: number;
  currentStreak: number;
  preferredLanguages: string[];
}

export interface SyncResult {
  reposProcessed: number;
  issuesFound: number;
  issuesUpdated: number;
  errors: string[];
}

export interface DCSBreakdown {
  mergeRate: number;
  difficultyGrowth: number;
  repoCaliber: number;
  consistency: number;
}

export interface DCSResult {
  score: number;
  level: string;
  breakdown: DCSBreakdown;
  totalFinished: number;
  totalMerged: number;
}
