import type { Job } from 'bullmq';
import prisma from '@/lib/db';
import { getNovu } from '@/lib/novu';
import { logger } from '@/lib/logger';

export async function processSendNotification(job: Job) {
  // Handle daily contribution reminders (scheduled at 9 AM)
  if (job.name === 'contribution-reminders') {
    return processContributionReminders(job);
  }

  logger.warn({ jobName: job.name }, 'Unknown notification job');
  return { sent: false };
}

async function processContributionReminders(job: Job) {
  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const eightDaysAgo = new Date(now.getTime() - 8 * 24 * 60 * 60 * 1000);

  const candidates = await prisma.userContribution.findMany({
    where: {
      status: 'STARTED',
      startedAt: { lte: sevenDaysAgo, gte: eightDaysAgo },
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

  let sent = 0;

  for (const c of candidates) {
    try {
      await getNovu().trigger({
        workflowId: 'contribution-reminder',
        to: c.userId,
        transactionId: `reminder-${c.id}`,
        payload: {
          repoFullName: c.issue.repository.fullName,
          issueTitle: c.issue.title,
          daysRemaining: 7,
        },
      });
      sent++;
    } catch (e) {
      logger.error({ contributionId: c.id, error: e }, 'Failed to send contribution reminder');
    }
  }

  logger.info({ jobId: job.id, candidates: candidates.length, sent }, 'Contribution reminders processed');
  return { candidates: candidates.length, sent };
}
