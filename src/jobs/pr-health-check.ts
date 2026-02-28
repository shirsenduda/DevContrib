import type { Job } from 'bullmq';
import prisma from '@/lib/db';
import { notifyPRWaiting5d, notifyPRWaiting10d } from '@/lib/notification-service';
import { logger } from '@/lib/logger';

export async function processPrHealthCheck(job: Job) {
  logger.info({ jobId: job.id }, 'Starting PR health check');

  const now = new Date();
  let sent5d = 0;
  let sent10d = 0;

  // --- 5-day notifications ---
  const fiveDaysAgo = new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000);
  const sixDaysAgo = new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000);

  const fiveDayCandidates = await prisma.userContribution.findMany({
    where: {
      status: 'PR_OPENED',
      prOpenedAt: { lte: fiveDaysAgo, gte: sixDaysAgo },
    },
    include: {
      issue: {
        select: {
          title: true,
          repository: { select: { fullName: true } },
        },
      },
    },
  });

  for (const c of fiveDayCandidates) {
    try {
      await notifyPRWaiting5d(c.userId, {
        repoFullName: c.issue.repository.fullName,
        issueTitle: c.issue.title,
        prNumber: c.prNumber!,
        prUrl: c.prUrl ?? '',
      });
      sent5d++;
    } catch (e) {
      logger.error({ contributionId: c.id, error: e }, 'Failed to send 5-day PR health notification');
    }
  }

  // --- 10-day notifications ---
  const tenDaysAgo = new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000);
  const elevenDaysAgo = new Date(now.getTime() - 11 * 24 * 60 * 60 * 1000);

  const tenDayCandidates = await prisma.userContribution.findMany({
    where: {
      status: 'PR_OPENED',
      prOpenedAt: { lte: tenDaysAgo, gte: elevenDaysAgo },
    },
    include: {
      issue: {
        select: {
          title: true,
          repository: { select: { fullName: true } },
        },
      },
    },
  });

  for (const c of tenDayCandidates) {
    try {
      await notifyPRWaiting10d(c.userId, {
        repoFullName: c.issue.repository.fullName,
        issueTitle: c.issue.title,
        prNumber: c.prNumber!,
        prUrl: c.prUrl ?? '',
      });
      sent10d++;
    } catch (e) {
      logger.error({ contributionId: c.id, error: e }, 'Failed to send 10-day PR health notification');
    }
  }

  logger.info(
    {
      jobId: job.id,
      fiveDayCandidates: fiveDayCandidates.length,
      tenDayCandidates: tenDayCandidates.length,
      sent5d,
      sent10d,
    },
    'PR health check completed',
  );

  return { fiveDayCandidates: fiveDayCandidates.length, tenDayCandidates: tenDayCandidates.length, sent5d, sent10d };
}
