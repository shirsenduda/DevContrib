import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

import { Queue } from 'bullmq';
import Redis from 'ioredis';

const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
  maxRetriesPerRequest: null,
});

const scrapeQueue = new Queue('scrape-github-issues', {
  connection: redis as any,
});

async function trigger() {
  // Clean up old failed/stale jobs
  await scrapeQueue.obliterate({ force: true });
  console.log('Queue cleaned.');

  const job = await scrapeQueue.add('manual-scrape', {
    triggeredBy: 'cli',
    triggeredAt: new Date().toISOString(),
  });

  console.log(`Scrape job queued with ID: ${job.id}`);
  console.log('The worker will pick it up and start scraping real GitHub data.');

  await redis.quit();
}

trigger().catch((e) => {
  console.error(e);
  process.exit(1);
});
