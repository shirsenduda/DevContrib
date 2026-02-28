import { NextRequest, after } from 'next/server';
import { createApiResponse, createErrorResponse } from '@/lib/api-helpers';
import prisma from '@/lib/db';
import { fullSync } from '@/services/github-sync';
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
