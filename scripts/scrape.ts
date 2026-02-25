import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

import { fullSync } from '../src/services/github-sync';
import { invalidateCache } from '../src/lib/redis';
import { logger } from '../src/lib/logger';
import prisma from '../src/lib/db';

async function main() {
  const start = Date.now();
  logger.info('Starting manual scrape...');

  // Create scrape log
  const scrapeLog = await prisma.scrapeLog.create({
    data: { status: 'RUNNING' },
  });

  try {
    const result = await fullSync();

    const duration = Math.round((Date.now() - start) / 1000);

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

    logger.info({
      reposScraped: result.reposProcessed,
      issuesFound: result.issuesFound,
      issuesUpdated: result.issuesUpdated,
      errors: result.errors.length,
      duration: `${Math.floor(duration / 60)}m ${duration % 60}s`,
    }, 'Scrape completed');

  } catch (error) {
    await prisma.scrapeLog.update({
      where: { id: scrapeLog.id },
      data: {
        status: 'FAILED',
        completedAt: new Date(),
        errors: [String(error)],
      },
    });

    logger.error({ error }, 'Scrape failed');
  } finally {
    await prisma.$disconnect();
    process.exit(0);
  }
}

main();
