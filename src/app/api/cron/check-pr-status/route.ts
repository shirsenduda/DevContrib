import { NextRequest } from 'next/server';
import { createApiResponse, createErrorResponse } from '@/lib/api-helpers';
import prisma from '@/lib/db';
import { getPullRequestStatus } from '@/lib/github';
import { notifyPRMerged, notifyPRClosed } from '@/lib/notification-service';
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
    logger.info('Starting cron PR status check');

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

          try {
            await notifyPRMerged(contribution.userId, {
              repoFullName: repo.fullName,
              issueTitle: contribution.issue.title,
              prNumber: contribution.prNumber!,
              prUrl: contribution.prUrl ?? '',
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

          try {
            await notifyPRClosed(contribution.userId, {
              repoFullName: repo.fullName,
              issueTitle: contribution.issue.title,
              prNumber: contribution.prNumber!,
              prUrl: contribution.prUrl ?? '',
            });
          } catch (e) {
            logger.error({ contributionId: contribution.id, error: e }, 'Failed to send pr-closed notification');
          }
        }

        checked++;
        await new Promise((r) => setTimeout(r, 1000));
      } catch (error) {
        logger.error({ contributionId: contribution.id, error }, 'Failed to check PR status');
      }
    }

    logger.info({ checked, updated }, 'Cron PR status check completed');
    return createApiResponse({ checked, updated });
  } catch (error) {
    logger.error({ error }, 'Cron PR status check failed');
    return createErrorResponse('PR status check failed', 500);
  }
}
