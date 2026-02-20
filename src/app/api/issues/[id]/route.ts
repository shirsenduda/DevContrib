import { NextRequest } from 'next/server';
import prisma from '@/lib/db';
import { createApiResponse, createErrorResponse, handleApiError, requireAuth } from '@/lib/api-helpers';
import { z } from 'zod/v4';

const ADMIN_USERNAMES = (process.env.ADMIN_USERNAMES || '').split(',').filter(Boolean);

const issuePatchSchema = z.object({
  difficulty: z.enum(['EASY', 'MEDIUM', 'HARD']),
});

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const issue = await prisma.issue.findUnique({
      where: { id },
      include: {
        repository: {
          select: {
            fullName: true,
            owner: true,
            name: true,
            language: true,
            stars: true,
            healthScore: true,
            description: true,
          },
        },
        _count: {
          select: { contributions: true },
        },
      },
    });

    if (!issue) {
      return createErrorResponse('Issue not found', 404);
    }

    return createApiResponse(issue);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth();

    // Admin-only endpoint
    if (!ADMIN_USERNAMES.includes(user.username)) {
      return createErrorResponse('Admin access required', 403);
    }

    const { id } = await params;
    const body = await request.json();
    const parsed = issuePatchSchema.safeParse(body);

    if (!parsed.success) {
      return createErrorResponse('Invalid difficulty value', 400);
    }

    const issue = await prisma.issue.update({
      where: { id },
      data: { difficulty: parsed.data.difficulty },
    });

    return createApiResponse(issue);
  } catch (error) {
    return handleApiError(error);
  }
}
