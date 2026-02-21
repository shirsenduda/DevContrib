import { NextRequest } from 'next/server';
import prisma from '@/lib/db';
import { requireAdmin } from '@/lib/admin';
import { createApiResponse, parsePaginationParams, handleApiError } from '@/lib/api-helpers';
export async function GET(request: NextRequest) {
  try {
    await requireAdmin();

    const { searchParams } = request.nextUrl;
    const { page, pageSize, skip } = parsePaginationParams(searchParams);
    const search = searchParams.get('search');

    const where = search
      ? {
          OR: [
            { username: { contains: search, mode: 'insensitive' as const } },
            { name: { contains: search, mode: 'insensitive' as const } },
            { email: { contains: search, mode: 'insensitive' as const } },
          ],
        }
      : {};

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: pageSize,
        select: {
          id: true,
          username: true,
          name: true,
          email: true,
          image: true,
          avatarUrl: true,
          skillLevel: true,
          preferredLanguages: true,
          createdAt: true,
          _count: {
            select: {
              contributions: true,
            },
          },
        },
      }),
      prisma.user.count({ where }),
    ]);

    return createApiResponse(users, { total, page, pageSize });
  } catch (error) {
    return handleApiError(error);
  }
}
