import dotenv from 'dotenv';
import path from 'path';

// Load .env.local first (has actual values), then .env as fallback
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });
import { createWorkers } from './src/jobs/workers';
import { setupScheduledJobs } from './src/jobs/queues';
import { logger } from './src/lib/logger';

async function main() {
  logger.info('Starting worker process...');

  // Register all workers
  const workers = createWorkers();
  logger.info(`${workers.length} workers registered`);

  // Setup scheduled/repeatable jobs
  await setupScheduledJobs();
  logger.info('Scheduled jobs configured');

  // Graceful shutdown
  const shutdown = async () => {
    logger.info('Shutting down workers...');
    await Promise.all(workers.map((w) => w.close()));
    logger.info('All workers closed');
    process.exit(0);
  };

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);

  logger.info('Worker process ready. Waiting for jobs...');
}

main().catch((err) => {
  logger.error({ err }, 'Worker process failed to start');
  process.exit(1);
});
