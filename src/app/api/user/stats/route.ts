import prisma from '@/lib/db';
import { createApiResponse, requireAuth, handleApiError } from '@/lib/api-helpers';
import { cacheGet, cacheSet } from '@/lib/redis';
import type { UserStats } from '@/types';

export async function GET() {
  try {
    const user = await requireAuth();

    // Check cache
    const cacheKey = `stats:${user.id}`;
    const cached = await cacheGet<UserStats>(cacheKey);
    if (cached) return createApiResponse(cached);

    const [totalContributions, mergedPRs, openPRs, profile] = await Promise.all([
      prisma.userContribution.count({ where: { userId: user.id } }),
      prisma.userContribution.count({
        where: { userId: user.id, status: 'PR_MERGED' },
      }),
      prisma.userContribution.count({
        where: { userId: user.id, status: 'PR_OPENED' },
      }),
      prisma.user.findUnique({
        where: { id: user.id },
        select: { preferredLanguages: true },
      }),
    ]);

    // Calculate streak (consecutive weeks with merged PRs)
    const recentMerges = await prisma.userContribution.findMany({
      where: { userId: user.id, status: 'PR_MERGED', mergedAt: { not: null } },
      orderBy: { mergedAt: 'desc' },
      select: { mergedAt: true },
      take: 52,
    });

    let currentStreak = 0;
    if (recentMerges.length > 0) {
      const now = new Date();
      let weekStart = new Date(now);
      weekStart.setDate(weekStart.getDate() - weekStart.getDay());
      weekStart.setHours(0, 0, 0, 0);

      for (let i = 0; i < 52; i++) {
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekEnd.getDate() + 7);

        const hasMergeInWeek = recentMerges.some((m) => {
          const mergeDate = m.mergedAt!;
          return mergeDate >= weekStart && mergeDate < weekEnd;
        });

        if (hasMergeInWeek) {
          currentStreak++;
        } else if (i > 0) {
          break;
        }

        weekStart = new Date(weekStart);
        weekStart.setDate(weekStart.getDate() - 7);
      }
    }

    const stats: UserStats = {
      totalContributions,
      mergedPRs,
      openPRs,
      successRate: totalContributions > 0 ? Math.round((mergedPRs / totalContributions) * 100) : 0,
      currentStreak,
      preferredLanguages: profile?.preferredLanguages || [],
    };

    await cacheSet(cacheKey, stats, 1800);

    return createApiResponse(stats);
  } catch (error) {
    return handleApiError(error);
  }
}
