import { NextRequest } from 'next/server';
import prisma from '@/lib/db';
import { requireAdmin } from '@/lib/admin';
import { createApiResponse, parsePaginationParams, handleApiError } from '@/lib/api-helpers';

export async function GET(request: NextRequest) {
  try {
    await requireAdmin();

    const { searchParams } = request.nextUrl;
    const { page, pageSize, skip } = parsePaginationParams(searchParams);

    const [logs, total] = await Promise.all([
      prisma.scrapeLog.findMany({
        orderBy: { startedAt: 'desc' },
        skip,
        take: pageSize,
      }),
      prisma.scrapeLog.count(),
    ]);

    return createApiResponse(logs, { total, page, pageSize });
  } catch (error) {
    return handleApiError(error);
  }
}
