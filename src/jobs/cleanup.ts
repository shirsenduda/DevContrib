import type { Job } from 'bullmq';
import prisma from '@/lib/db';
import { cacheDeletePattern } from '@/lib/redis';
import { logger } from '@/lib/logger';

export async function processCleanup(job: Job) {
  logger.info({ jobId: job.id }, 'Starting cleanup job');

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

  await job.updateProgress(25);
  logger.info({ count: abandonedCount.count }, 'Abandoned stale contributions');

  // 2. Mark old closed issues as not open
  const closedIssuesCount = await prisma.issue.updateMany({
    where: {
      isOpen: true,
      updatedAtGithub: { lt: ninetyDaysAgo },
    },
    data: { isOpen: false },
  });

  await job.updateProgress(50);
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

  await job.updateProgress(75);
  logger.info({ count: deactivatedRepos.count }, 'Deactivated low-quality repos');

  // 4. Purge old scrape logs (older than 90 days)
  const deletedLogs = await prisma.scrapeLog.deleteMany({
    where: { createdAt: { lt: ninetyDaysAgo } },
  });

  logger.info({ count: deletedLogs.count }, 'Purged old scrape logs');

  // 5. Clear stale cache
  await cacheDeletePattern('repos:*');
  await cacheDeletePattern('issues:*');
  await cacheDeletePattern('stats:*');

  await job.updateProgress(100);

  const result = {
    abandonedContributions: abandonedCount.count,
    closedIssues: closedIssuesCount.count,
    deactivatedRepos: deactivatedRepos.count,
    deletedLogs: deletedLogs.count,
  };

  logger.info({ jobId: job.id, ...result }, 'Cleanup completed');
  return result;
}
