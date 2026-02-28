import type { Job } from 'bullmq';
import prisma from '@/lib/db';
import { fullSync } from '@/services/github-sync';
import { logger } from '@/lib/logger';

export async function processScrapeJob(job: Job) {
  logger.info({ jobId: job.id }, 'Starting scrape job');

  const scrapeLog = await prisma.scrapeLog.create({
    data: { status: 'RUNNING' },
  });

  try {
    await job.updateProgress(10);

    const result = await fullSync();

    await job.updateProgress(90);

    await prisma.scrapeLog.update({
      where: { id: scrapeLog.id },
      data: {
        status: 'COMPLETED',
        completedAt: new Date(),
        reposScraped: result.reposProcessed,
        issuesFound: result.issuesFound,
        issuesUpdated: result.issuesUpdated,
        errors: result.errors,
      },
    });

    await job.updateProgress(100);

    logger.info(
      {
        jobId: job.id,
        reposScraped: result.reposProcessed,
        issuesFound: result.issuesFound,
        issuesUpdated: result.issuesUpdated,
        errors: result.errors.length,
      },
      'Scrape job completed',
    );

    return result;
  } catch (error) {
    await prisma.scrapeLog.update({
      where: { id: scrapeLog.id },
      data: {
        status: 'FAILED',
        completedAt: new Date(),
        errors: [String(error)],
      },
    });

    logger.error({ jobId: job.id, error }, 'Scrape job failed');
    throw error;
  }
}
