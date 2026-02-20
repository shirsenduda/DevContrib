import { Queue, type ConnectionOptions } from 'bullmq';
import { redis } from '@/lib/redis';

const connection = redis as unknown as ConnectionOptions;

export const scrapeQueue = new Queue('scrape-github-issues', {
  connection,
  defaultJobOptions: {
    attempts: 2,
    backoff: { type: 'exponential', delay: 30000 },
    removeOnComplete: { count: 10 },
    removeOnFail: { count: 5 },
  },
});

export const probabilityQueue = new Queue('update-merge-probabilities', {
  connection,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: 'exponential', delay: 5000 },
    removeOnComplete: { count: 50 },
    removeOnFail: { count: 20 },
  },
});

export const prStatusQueue = new Queue('check-pr-status', {
  connection,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: 'exponential', delay: 10000 },
    removeOnComplete: { count: 50 },
    removeOnFail: { count: 20 },
  },
});

export const cleanupQueue = new Queue('cleanup-stale-data', {
  connection,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: 'exponential', delay: 5000 },
    removeOnComplete: { count: 20 },
    removeOnFail: { count: 10 },
  },
});

export const notificationQueue = new Queue('send-notifications', {
  connection,
  defaultJobOptions: {
    attempts: 4,
    backoff: { type: 'exponential', delay: 3000 },
    removeOnComplete: { count: 100 },
    removeOnFail: { count: 50 },
  },
});

export async function setupScheduledJobs() {
  // Scrape every 6 hours
  await scrapeQueue.upsertJobScheduler(
    'scheduled-scrape',
    { pattern: '0 */6 * * *' },
    { name: 'scheduled-scrape' },
  );

  // Update merge probabilities daily at 2 AM
  await probabilityQueue.upsertJobScheduler(
    'scheduled-probability-update',
    { pattern: '0 2 * * *' },
    { name: 'scheduled-probability-update' },
  );

  // Check PR status every hour
  await prStatusQueue.upsertJobScheduler(
    'scheduled-pr-check',
    { pattern: '0 * * * *' },
    { name: 'scheduled-pr-check' },
  );

  // Cleanup stale data weekly on Sunday at 3 AM
  await cleanupQueue.upsertJobScheduler(
    'scheduled-cleanup',
    { pattern: '0 3 * * 0' },
    { name: 'scheduled-cleanup' },
  );

  // Daily contribution reminders at 9 AM (for 7-day-old STARTED contributions)
  await notificationQueue.upsertJobScheduler(
    'daily-contribution-reminders',
    { pattern: '0 9 * * *' },
    { name: 'contribution-reminders' },
  );
}
