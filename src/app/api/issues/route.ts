import { NextRequest } from 'next/server';
import prisma from '@/lib/db';
import { cacheGet, cacheSet } from '@/lib/redis';
import {
  createApiResponse,
  parsePaginationParams,
  handleApiError,
} from '@/lib/api-helpers';
import { issueFilterSchema } from '@/types/schemas';
import type { Difficulty } from '@/types';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const { page, pageSize, skip } = parsePaginationParams(searchParams);

    const filters = issueFilterSchema.safeParse({
      difficulty: searchParams.get('difficulty') || undefined,
      language: searchParams.get('language') || undefined,
      owner: searchParams.get('owner') || undefined,
      minStars: searchParams.get('minStars') || undefined,
      sortBy: searchParams.get('sortBy') || undefined,
    });

    const difficulty = filters.success ? filters.data.difficulty : undefined;
    const language = filters.success ? filters.data.language : undefined;
    const owner = filters.success ? filters.data.owner : undefined;
    const minStars = filters.success ? filters.data.minStars : undefined;
    const sortBy = filters.success ? filters.data.sortBy : 'mergeProbability';

    // Cache
    const cacheKey = `issues:${difficulty}:${language}:${owner}:${minStars}:${sortBy}:${page}:${pageSize}`;
    const cached = await cacheGet<{ issues: unknown[]; total: number }>(cacheKey);
    if (cached) return createApiResponse(cached.issues, { total: cached.total, page, pageSize });

    // Build query
    const repoFilter = {
      ...(language && { language }),
      ...(owner && { owner: { contains: owner, mode: 'insensitive' as const } }),
      ...(minStars && { stars: { gte: minStars } }),
    };

    const hasRepoFilter = language || owner || minStars;

    const where = {
      isOpen: true,
      isAssigned: false,
      ...(difficulty && { difficulty: difficulty as Difficulty }),
      ...(hasRepoFilter && { repository: repoFilter }),
    };

    const orderBy =
      sortBy === 'stars'
        ? { repository: { stars: 'desc' as const } }
        : sortBy === 'newest'
          ? { createdAtGithub: 'desc' as const }
          : { mergeProbability: 'desc' as const };

    const [issues, total] = await Promise.all([
      prisma.issue.findMany({
        where,
        orderBy,
        skip,
        take: pageSize,
        include: {
          repository: {
            select: {
              fullName: true,
              owner: true,
              name: true,
              language: true,
              stars: true,
              healthScore: true,
            },
          },
        },
      }),
      prisma.issue.count({ where }),
    ]);

    await cacheSet(cacheKey, { issues, total }, 1800);

    return createApiResponse(issues, { total, page, pageSize });
  } catch (error) {
    return handleApiError(error);
  }
}
