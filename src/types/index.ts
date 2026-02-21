// Prisma 7 with @prisma/adapter-pg does not export enum types from '@prisma/client'.
// Define them locally as string literal unions matching prisma/schema.prisma.
export type Difficulty = 'EASY' | 'MEDIUM' | 'HARD';
export type SkillLevel = 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
export type ContributionStatus = 'STARTED' | 'PR_OPENED' | 'PR_MERGED' | 'PR_CLOSED' | 'ABANDONED';
export type ScrapeStatus = 'RUNNING' | 'COMPLETED' | 'FAILED';

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
