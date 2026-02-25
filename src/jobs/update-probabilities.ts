import type { Job } from 'bullmq';
import prisma from '@/lib/db';
import { calculateMergeProbability } from '@/services/scoring';
import { invalidateCache } from '@/lib/redis';
import { logger } from '@/lib/logger';

const BATCH_SIZE = 100;

export async function processUpdateProbabilities(job: Job) {
  logger.info({ jobId: job.id }, 'Starting probability update job');

  const openIssues = await prisma.issue.findMany({
    where: { isOpen: true },
    include: {
      repository: {
        select: { healthScore: true },
      },
    },
  });

  let updated = 0;

  // Process in batches
  for (let i = 0; i < openIssues.length; i += BATCH_SIZE) {
    const batch = openIssues.slice(i, i + BATCH_SIZE);

    await prisma.$transaction(
      batch.map((issue) => {
        const daysSinceCreated =
          (Date.now() - issue.createdAtGithub.getTime()) / (1000 * 60 * 60 * 24);

        const newProbability = calculateMergeProbability({
          isAssigned: issue.isAssigned,
          commentCount: issue.commentCount,
          labels: issue.labels,
          repoHealthScore: issue.repository.healthScore,
          daysSinceCreated,
        });

        return prisma.issue.update({
          where: { id: issue.id },
          data: { mergeProbability: newProbability },
        });
      }),
    );

    updated += batch.length;
    await job.updateProgress(Math.round((updated / openIssues.length) * 100));
  }

  // Invalidate recommendation caches
  await invalidateCache('recommendations');

  logger.info({ jobId: job.id, updated }, 'Probability update completed');
  return { updated };
}
