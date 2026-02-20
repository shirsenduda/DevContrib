import { NextRequest } from 'next/server';
import prisma from '@/lib/db';
import { createApiResponse, createErrorResponse, handleApiError, requireAuth } from '@/lib/api-helpers';

const ADMIN_USERNAMES = (process.env.ADMIN_USERNAMES || '').split(',').filter(Boolean);

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const repository = await prisma.repository.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            issues: { where: { isOpen: true } },
          },
        },
        issues: {
          where: { isOpen: true, isAssigned: false },
          orderBy: { mergeProbability: 'desc' },
          take: 10,
        },
      },
    });

    if (!repository) {
      return createErrorResponse('Repository not found', 404);
    }

    return createApiResponse(repository);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth();

    if (!ADMIN_USERNAMES.includes(user.username)) {
      return createErrorResponse('Admin access required', 403);
    }

    const { id } = await params;
    const body = await request.json();

    if (typeof body.isActive !== 'boolean') {
      return createErrorResponse('isActive must be a boolean', 400);
    }

    const repository = await prisma.repository.update({
      where: { id },
      data: { isActive: body.isActive },
    });

    return createApiResponse(repository);
  } catch (error) {
    return handleApiError(error);
  }
}
