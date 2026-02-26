import { NextRequest } from 'next/server';
import { createApiResponse, createErrorResponse } from '@/lib/api-helpers';
import prisma from '@/lib/db';
import { calculateMergeProbability } from '@/services/scoring';
import { invalidateCache } from '@/lib/redis';
import { logger } from '@/lib/logger';

const BATCH_SIZE = 100;

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
    logger.info('Starting cron probability update');

    const openIssues = await prisma.issue.findMany({
      where: { isOpen: true },
      include: {
        repository: {
          select: { healthScore: true },
        },
      },
    });

    let updated = 0;

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
    }

    await invalidateCache('recommendations');

    logger.info({ updated }, 'Cron probability update completed');
    return createApiResponse({ updated });
  } catch (error) {
    logger.error({ error }, 'Cron probability update failed');
    return createErrorResponse('Probability update failed', 500);
  }
}
