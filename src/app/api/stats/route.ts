import { NextRequest } from 'next/server';
import { createApiResponse, createErrorResponse } from '@/lib/api-helpers';
import { withRateLimit } from '@/lib/rate-limit';
import prisma from '@/lib/db';
import { logger } from '@/lib/logger';

export async function GET(request: NextRequest) {
  try {
    const rateLimited = await withRateLimit(request, { maxRequests: 30, windowMs: 60_000 });
    if (rateLimited) return rateLimited;

    const [repoCount, issueCount, mergedCount, totalContributions, avgMerge] = await Promise.all([
      prisma.repository.count({ where: { isActive: true } }),
      prisma.issue.count({ where: { isOpen: true } }),
      prisma.userContribution.count({ where: { status: 'PR_MERGED' } }),
      prisma.userContribution.count(),
      prisma.issue.aggregate({
        where: { isOpen: true, mergeProbability: { gt: 0 } },
        _avg: { mergeProbability: true },
      }),
    ]);

    // Use real platform merge rate when contribution data exists;
    // fall back to average merge probability of curated issues (cold-start).
    const mergeRate = totalContributions > 0
      ? Math.round((mergedCount / totalContributions) * 100)
      : Math.round((avgMerge._avg.mergeProbability ?? 0) * 100);

    return createApiResponse({
      repos: repoCount,
      issues: issueCount,
      mergeRate,
    });
  } catch (error) {
    logger.error({ error }, 'Failed to fetch public stats');
    return createErrorResponse('Failed to fetch stats', 500);
  }
}
