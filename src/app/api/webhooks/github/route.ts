import { NextRequest, NextResponse } from 'next/server';
import { Webhooks } from '@octokit/webhooks';
import prisma from '@/lib/db';
import { notifyPRMerged, notifyPRClosed } from '@/lib/notification-service';
import { logger } from '@/lib/logger';

function getWebhooks() {
  const secret = process.env.GITHUB_WEBHOOK_SECRET;
  if (!secret && process.env.NODE_ENV === 'production') {
    throw new Error('GITHUB_WEBHOOK_SECRET must be set in production');
  }
  return new Webhooks({ secret: secret || 'development-secret' });
}

export async function POST(request: NextRequest) {
  try {
    const webhooks = getWebhooks();
    const body = await request.text();
    const signature = request.headers.get('x-hub-signature-256') || '';
    const event = request.headers.get('x-github-event') || '';

    // Verify signature
    const isValid = await webhooks.verify(body, signature);
    if (!isValid) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    const payload = JSON.parse(body);

    switch (event) {
      case 'ping':
        return NextResponse.json({ message: 'pong' });

      case 'pull_request':
        await handlePullRequestEvent(payload);
        break;

      case 'issues':
        await handleIssueEvent(payload);
        break;

      default:
        logger.info({ event }, 'Unhandled webhook event');
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    logger.error({ error }, 'Webhook processing error');
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}

async function handlePullRequestEvent(payload: { action: string; pull_request: { number: number; merged: boolean; merged_at: string; closed_at: string } }) {
  const { action, pull_request } = payload;
  const prNumber = pull_request.number;

  // Find contributions linked to this PR (include issue data for notifications)
  const contributions = await prisma.userContribution.findMany({
    where: { prNumber },
    include: {
      issue: {
        select: {
          title: true,
          repository: { select: { fullName: true } },
        },
      },
    },
  });

  if (contributions.length === 0) return;

  for (const contribution of contributions) {
    if (action === 'closed' && pull_request.merged) {
      await prisma.userContribution.update({
        where: { id: contribution.id },
        data: {
          status: 'PR_MERGED',
          mergedAt: new Date(pull_request.merged_at),
        },
      });
      logger.info({ prNumber, contributionId: contribution.id }, 'PR merged');

      if (contribution.prNumber && contribution.prUrl) {
        try {
          await notifyPRMerged(contribution.userId, {
            repoFullName: contribution.issue.repository.fullName,
            issueTitle: contribution.issue.title,
            prNumber: contribution.prNumber,
            prUrl: contribution.prUrl,
          });
        } catch (e) {
          logger.error({ contributionId: contribution.id, error: e }, 'Failed to send pr-merged notification');
        }
      }
    } else if (action === 'closed' && !pull_request.merged) {
      await prisma.userContribution.update({
        where: { id: contribution.id },
        data: {
          status: 'PR_CLOSED',
          closedAt: new Date(pull_request.closed_at),
        },
      });
      logger.info({ prNumber, contributionId: contribution.id }, 'PR closed without merge');

      if (contribution.prNumber && contribution.prUrl) {
        try {
          await notifyPRClosed(contribution.userId, {
            repoFullName: contribution.issue.repository.fullName,
            issueTitle: contribution.issue.title,
            prNumber: contribution.prNumber,
            prUrl: contribution.prUrl,
          });
        } catch (e) {
          logger.error({ contributionId: contribution.id, error: e }, 'Failed to send pr-closed notification');
        }
      }
    }
  }
}

async function handleIssueEvent(payload: { action: string; issue: { id: number } }) {
  const { action, issue } = payload;
  const githubId = issue.id;

  if (action === 'closed' || action === 'reopened') {
    await prisma.issue.updateMany({
      where: { githubId },
      data: { isOpen: action === 'reopened' },
    });
    logger.info({ githubId, action }, 'Issue status updated');
  }
}
