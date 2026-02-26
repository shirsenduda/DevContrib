import { NextRequest, after } from 'next/server';
import { createApiResponse, createErrorResponse } from '@/lib/api-helpers';
import prisma from '@/lib/db';
import { fullSync } from '@/services/github-sync';
import { getNovu } from '@/lib/novu';
import { logger } from '@/lib/logger';

function verifyCronSecret(request: NextRequest): boolean {
  const secret = request.headers.get('authorization')?.replace('Bearer ', '');
  const expected = process.env.CRON_SECRET;
  if (!expected) return false;
  return secret === expected;
}

async function runScrape(scrapeLogId: string) {
  try {
    const result = await fullSync();

    await prisma.scrapeLog.update({
      where: { id: scrapeLogId },
      data: {
        status: 'COMPLETED',
        completedAt: new Date(),
        reposScraped: result.reposProcessed,
        issuesFound: result.issuesFound,
        issuesUpdated: result.issuesUpdated,
        errors: result.errors,
      },
    });

    // Notify users about new issues matching their preferred languages
    try {
      const sixHoursAgo = new Date(Date.now() - 6 * 60 * 60 * 1000);
      const newIssues = await prisma.issue.findMany({
        where: { createdAt: { gte: sixHoursAgo }, isOpen: true, isAssigned: false },
        select: {
          title: true,
          difficulty: true,
          repository: { select: { fullName: true, language: true } },
        },
      });

      if (newIssues.length > 0) {
        const issuesByLang = new Map<string, typeof newIssues>();
        for (const issue of newIssues) {
          const lang = issue.repository.language || 'Other';
          if (!issuesByLang.has(lang)) issuesByLang.set(lang, []);
          issuesByLang.get(lang)!.push(issue);
        }

        const today = new Date().toISOString().split('T')[0];
        for (const [lang, issues] of issuesByLang) {
          const users = await prisma.user.findMany({
            where: { preferredLanguages: { has: lang } },
            select: { id: true },
          });

          for (const u of users) {
            try {
              await getNovu().trigger({
                workflowId: 'new-recommendations',
                to: u.id,
                transactionId: `recs-${u.id}-${today}`,
                payload: {
                  issueCount: issues.length,
                  topIssues: issues.slice(0, 3).map((i) => ({
                    title: i.title,
                    repoFullName: i.repository.fullName,
                    difficulty: i.difficulty,
                  })),
                },
              });
            } catch (e) {
              logger.error({ userId: u.id, error: e }, 'Failed to send recommendation notification');
            }
          }
        }
      }
    } catch (e) {
      logger.error({ error: e }, 'Failed to process recommendation notifications');
    }

    logger.info({ reposScraped: result.reposProcessed, issuesFound: result.issuesFound, issuesUpdated: result.issuesUpdated }, 'Cron scrape completed');
  } catch (error) {
    await prisma.scrapeLog.update({
      where: { id: scrapeLogId },
      data: {
        status: 'FAILED',
        completedAt: new Date(),
        errors: [String(error)],
      },
    });
    logger.error({ error }, 'Cron scrape failed');
  }
}

export async function POST(request: NextRequest) {
  if (!verifyCronSecret(request)) {
    return createErrorResponse('Unauthorized', 401);
  }

  const scrapeLog = await prisma.scrapeLog.create({
    data: { status: 'RUNNING' },
  });

  // Run in background — respond immediately, work continues after response
  after(() => runScrape(scrapeLog.id));

  return createApiResponse({
    scrapeLogId: scrapeLog.id,
    message: 'Scrape started',
  });
}
