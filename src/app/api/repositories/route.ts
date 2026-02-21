import { NextRequest } from 'next/server';
import prisma from '@/lib/db';
import { cacheGet, cacheSet } from '@/lib/redis';
import {
  createApiResponse,
  createErrorResponse,
  parsePaginationParams,
  handleApiError,
} from '@/lib/api-helpers';
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const { page, pageSize, skip } = parsePaginationParams(searchParams);
    const language = searchParams.get('language');
    const minStars = parseInt(searchParams.get('minStars') || '0', 10);

    // Cache key
    const cacheKey = `repos:${language}:${minStars}:${page}:${pageSize}`;
    const cached = await cacheGet(cacheKey);
    if (cached) return createApiResponse(cached);

    // Build query
    const where = {
      isActive: true,
      ...(language && { language }),
      ...(minStars > 0 && { stars: { gte: minStars } }),
    };

    const [repositories, total] = await Promise.all([
      prisma.repository.findMany({
        where,
        orderBy: { healthScore: 'desc' },
        skip,
        take: pageSize,
        include: {
          _count: { select: { issues: { where: { isOpen: true } } } },
        },
      }),
      prisma.repository.count({ where }),
    ]);

    const result = { data: repositories, meta: { total, page, pageSize } };
    await cacheSet(cacheKey, result, 300);

    return createApiResponse(repositories, { total, page, pageSize });
  } catch (error) {
    return handleApiError(error);
  }
}
