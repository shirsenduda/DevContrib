import prisma from '@/lib/db';
import { createApiResponse, requireAuth, handleApiError } from '@/lib/api-helpers';
import { cacheGet, cacheSet } from '@/lib/redis';
import { calculateDCS } from '@/services/dcs-scoring';
import type { ContributionInput } from '@/services/dcs-scoring';

export async function GET() {
  try {
    const user = await requireAuth();

    // Check cache (10 min TTL — score changes infrequently)
    const cacheKey = `dcs:${user.id}`;
    const cached = await cacheGet<ReturnType<typeof calculateDCS>>(cacheKey);
    if (cached) return createApiResponse(cached);

    // Fetch all contributions with issue difficulty and repo stars
    const contributions = await prisma.userContribution.findMany({
      where: { userId: user.id },
      select: {
        status: true,
        startedAt: true,
        mergedAt: true,
        issue: {
          select: {
            difficulty: true,
            repository: {
              select: { stars: true },
            },
          },
        },
      },
    });

    // Transform to scoring input (filter out contributions with missing issue/repository data)
    const inputs: ContributionInput[] = contributions
      .filter(c => c.issue?.repository)
      .map((c) => ({
        status: c.status,
        difficulty: c.issue.difficulty,
        repoStars: c.issue.repository.stars,
        startedAt: c.startedAt,
        mergedAt: c.mergedAt,
      }));

    const result = calculateDCS(inputs);

    await cacheSet(cacheKey, result, 600);

    return createApiResponse(result);
  } catch (error) {
    return handleApiError(error);
  }
}
