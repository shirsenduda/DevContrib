import { Worker, type ConnectionOptions } from 'bullmq';
import { redis } from '@/lib/redis';
import { logger } from '@/lib/logger';
import { processScrapeJob } from './scrape-issues';
import { processUpdateProbabilities } from './update-probabilities';
import { processCheckPrStatus } from './check-pr-status';
import { processCleanup } from './cleanup';
import { processSendNotification } from './send-notifications';
import { processPrHealthCheck } from './pr-health-check';

export function createWorkers() {
  const connection = redis as unknown as ConnectionOptions;

  const workers = [
    new Worker('scrape-github-issues', processScrapeJob, {
      connection,
      concurrency: 1,
      limiter: { max: 1, duration: 1000 },
    }),
    new Worker('update-merge-probabilities', processUpdateProbabilities, {
      connection,
      concurrency: 1,
    }),
    new Worker('check-pr-status', processCheckPrStatus, {
      connection,
      concurrency: 2,
    }),
    new Worker('cleanup-stale-data', processCleanup, {
      connection,
      concurrency: 1,
    }),
    new Worker('send-notifications', processSendNotification, {
      connection,
      concurrency: 5,
    }),
    new Worker('pr-health-check', processPrHealthCheck, {
      connection,
      concurrency: 1,
    }),
  ];

  workers.forEach((worker) => {
    worker.on('completed', (job) => {
      logger.info({ jobId: job?.id, queue: worker.name }, 'Job completed');
    });

    worker.on('failed', (job, err) => {
      logger.error(
        { jobId: job?.id, queue: worker.name, attempt: job?.attemptsMade, err },
        'Job failed',
      );
    });

    worker.on('error', (err) => {
      logger.error({ queue: worker.name, err }, 'Worker error');
    });
  });

  return workers;
}
