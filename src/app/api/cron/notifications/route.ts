import { NextRequest } from 'next/server';
import { createApiResponse, createErrorResponse } from '@/lib/api-helpers';
import prisma from '@/lib/db';
import { getNovu } from '@/lib/novu';
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
    logger.info('Starting cron notifications (reminders + PR health)');

    // ── Contribution Reminders (7-day-old STARTED contributions) ──
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const eightDaysAgo = new Date(now.getTime() - 8 * 24 * 60 * 60 * 1000);

    const reminderCandidates = await prisma.userContribution.findMany({
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

    let remindersSent = 0;
    for (const c of reminderCandidates) {
      try {
        await getNovu().trigger({
          workflowId: 'dc-contribution-reminder',
          to: c.userId,
          transactionId: `reminder-${c.id}`,
          payload: {
            repoFullName: c.issue.repository.fullName,
            issueTitle: c.issue.title,
            daysRemaining: 7,
          },
        });
        remindersSent++;
      } catch (e) {
        logger.error({ contributionId: c.id, error: e }, 'Failed to send contribution reminder');
      }
    }

    // ── PR Health Check (5-day and 10-day stale PRs) ──
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

    let sent5d = 0;
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

    let sent10d = 0;
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

    const result = {
      reminders: { candidates: reminderCandidates.length, sent: remindersSent },
      prHealth5d: { candidates: fiveDayCandidates.length, sent: sent5d },
      prHealth10d: { candidates: tenDayCandidates.length, sent: sent10d },
    };

    logger.info(result, 'Cron notifications completed');
    return createApiResponse(result);
  } catch (error) {
    logger.error({ error }, 'Cron notifications failed');
    return createErrorResponse('Notifications failed', 500);
  }
}
