import { NextRequest } from 'next/server';
import { createApiResponse, createErrorResponse } from '@/lib/api-helpers';
import prisma from '@/lib/db';
import { invalidateCache } from '@/lib/redis';
import { logger } from '@/lib/logger';

function verifyCronSecret(request: NextRequest): boolean {
  const secret = request.headers.get('authorization')?.replace('Bearer ', '');
  const expected = process.env.CRON_SECRET;
  if (!expected) return false;
  return secret === expected;
}

export async function POST(request: NextRequest) {
  if (!verifyCronSecret(request)) {
    return createErrorResponse('Unauthorized', 401);
  }

  try {
    logger.info('Starting cron cleanup');

    const now = new Date();
    const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
    const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);

    // 1. Mark STARTED contributions as ABANDONED if no PR opened within 14 days
    const abandonedCount = await prisma.userContribution.updateMany({
      where: {
        status: 'STARTED',
        startedAt: { lt: fourteenDaysAgo },
      },
      data: {
        status: 'ABANDONED',
        closedAt: now,
      },
    });

    logger.info({ count: abandonedCount.count }, 'Abandoned stale contributions');

    // 2. Mark old closed issues as not open
    const closedIssuesCount = await prisma.issue.updateMany({
      where: {
        isOpen: true,
        updatedAtGithub: { lt: ninetyDaysAgo },
      },
      data: { isOpen: false },
    });

    logger.info({ count: closedIssuesCount.count }, 'Marked stale issues as closed');

    // 3. Deactivate repos with no open issues and low health scores
    const deactivatedRepos = await prisma.repository.updateMany({
      where: {
        isActive: true,
        healthScore: { lt: 20 },
        openIssuesCount: 0,
      },
      data: { isActive: false },
    });

    logger.info({ count: deactivatedRepos.count }, 'Deactivated low-quality repos');

    // 4. Purge old scrape logs (older than 90 days)
    const deletedLogs = await prisma.scrapeLog.deleteMany({
      where: { createdAt: { lt: ninetyDaysAgo } },
    });

    logger.info({ count: deletedLogs.count }, 'Purged old scrape logs');

    // 5. Clear stale cache
    await invalidateCache('repos', 'issues', 'stats');

    const result = {
      abandonedContributions: abandonedCount.count,
      closedIssues: closedIssuesCount.count,
      deactivatedRepos: deactivatedRepos.count,
      deletedLogs: deletedLogs.count,
    };

    logger.info(result, 'Cron cleanup completed');
    return createApiResponse(result);
  } catch (error) {
    logger.error({ error }, 'Cron cleanup failed');
    return createErrorResponse('Cleanup failed', 500);
  }
}
