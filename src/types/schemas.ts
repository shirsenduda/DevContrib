import { z } from 'zod/v4';

export const issueFilterSchema = z.object({
  difficulty: z.enum(['EASY', 'MEDIUM', 'HARD']).optional(),
  language: z.string().optional(),
  owner: z.string().optional(),
  minStars: z.coerce.number().int().min(0).optional(),
  sortBy: z.enum(['mergeProbability', 'stars', 'newest']).optional().default('mergeProbability'),
  page: z.coerce.number().int().min(1).optional().default(1),
  pageSize: z.coerce.number().int().min(1).max(100).optional().default(20),
});

export type IssueFilter = z.infer<typeof issueFilterSchema>;

export const contributionCreateSchema = z.object({
  issueId: z.string().min(1),
});

export const contributionUpdateSchema = z.object({
  prUrl: z.url().optional(),
  prNumber: z.number().int().positive().optional(),
  status: z.enum(['STARTED', 'PR_OPENED', 'PR_MERGED', 'PR_CLOSED', 'ABANDONED']),
});

export const userProfileSchema = z.object({
  skillLevel: z.enum(['BEGINNER', 'INTERMEDIATE', 'ADVANCED']),
  preferredLanguages: z.array(z.string()).max(10),
  bio: z.string().max(500).optional(),
});

export type UserProfileInput = z.infer<typeof userProfileSchema>;
