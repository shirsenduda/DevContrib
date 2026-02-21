import type { Job } from 'bullmq';
import prisma from '@/lib/db';
import { getPullRequestStatus } from '@/lib/github';
import { getNovu } from '@/lib/novu';
import { logger } from '@/lib/logger';

export async function processCheckPrStatus(job: Job) {
  logger.info({ jobId: job.id }, 'Starting PR status check');

  const openContributions = await prisma.userContribution.findMany({
    where: { status: 'PR_OPENED', prNumber: { not: null } },
    include: {
      issue: {
        select: {
          title: true,
          repository: {
            select: { owner: true, name: true, fullName: true },
          },
        },
      },
    },
  });

  let checked = 0;
  let updated = 0;

  for (const contribution of openContributions) {
    try {
      const repo = contribution.issue.repository;
      const status = await getPullRequestStatus(repo.owner, repo.name, contribution.prNumber!);

      if (status.merged) {
        await prisma.userContribution.update({
          where: { id: contribution.id },
          data: {
            status: 'PR_MERGED',
            mergedAt: status.mergedAt ? new Date(status.mergedAt) : new Date(),
          },
        });
        updated++;
        logger.info({ contributionId: contribution.id }, 'PR merged');

        try {
          await getNovu().trigger({
            workflowId: 'dc-pr-merged',
            to: contribution.userId,
            transactionId: `pr-merged-${contribution.id}`,
            payload: {
              repoFullName: repo.fullName,
              issueTitle: contribution.issue.title,
              prNumber: contribution.prNumber,
              prUrl: contribution.prUrl,
            },
          });
        } catch (e) {
          logger.error({ contributionId: contribution.id, error: e }, 'Failed to send pr-merged notification');
        }
      } else if (status.state === 'closed') {
        await prisma.userContribution.update({
          where: { id: contribution.id },
          data: {
            status: 'PR_CLOSED',
            closedAt: status.closedAt ? new Date(status.closedAt) : new Date(),
          },
        });
        updated++;
        logger.info({ contributionId: contribution.id }, 'PR closed');

        try {
          await getNovu().trigger({
            workflowId: 'dc-pr-closed',
            to: contribution.userId,
            transactionId: `pr-closed-${contribution.id}`,
            payload: {
              repoFullName: repo.fullName,
              issueTitle: contribution.issue.title,
              prNumber: contribution.prNumber,
              prUrl: contribution.prUrl,
            },
          });
        } catch (e) {
          logger.error({ contributionId: contribution.id, error: e }, 'Failed to send pr-closed notification');
        }
      }

      checked++;

      // Rate limiting: 1 second between API calls
      await new Promise((r) => setTimeout(r, 1000));
    } catch (error) {
      logger.error({ contributionId: contribution.id, error }, 'Failed to check PR status');
    }

    await job.updateProgress(Math.round((checked / openContributions.length) * 100));
  }

  logger.info({ jobId: job.id, checked, updated }, 'PR status check completed');
  return { checked, updated };
}
