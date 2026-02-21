import type { Job } from 'bullmq';
import prisma from '@/lib/db';
import { getNovu } from '@/lib/novu';
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
      await getNovu().trigger({
        workflowId: 'dc-pr-waiting-5d',
        to: c.userId,
        transactionId: `pr-health-5d-${c.id}`,
        payload: {
          repoFullName: c.issue.repository.fullName,
          issueTitle: c.issue.title,
          prNumber: c.prNumber,
          prUrl: c.prUrl,
          daysWaiting: 5,
          tips: [
            'Check if your CI/tests are passing on the PR',
            'Leave a polite comment: "Ready for review when you have time!"',
            'Check if the repo has a Discord or Slack — ask there',
          ],
        },
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
      await getNovu().trigger({
        workflowId: 'dc-pr-waiting-10d',
        to: c.userId,
        transactionId: `pr-health-10d-${c.id}`,
        payload: {
          repoFullName: c.issue.repository.fullName,
          issueTitle: c.issue.title,
          prNumber: c.prNumber,
          prUrl: c.prUrl,
          daysWaiting: 10,
          tips: [
            'Tag a specific maintainer (check the CODEOWNERS file)',
            'Check if the repo is still active — look at recent merge dates',
            'Start a parallel contribution while waiting — your DCS score counts multiple active contributions',
          ],
        },
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
