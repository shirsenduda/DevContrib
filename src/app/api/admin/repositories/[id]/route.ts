import { NextRequest } from 'next/server';
import { z } from 'zod/v4';
import prisma from '@/lib/db';
import { requireAdmin } from '@/lib/admin';
import { createApiResponse, createErrorResponse, validateBody, handleApiError } from '@/lib/api-helpers';

const updateRepoSchema = z.object({
  isActive: z.boolean().optional(),
  description: z.string().optional(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireAdmin();

    const { id } = await params;
    const body = await request.json();
    const data = validateBody(updateRepoSchema, body);

    const existing = await prisma.repository.findUnique({ where: { id } });
    if (!existing) {
      return createErrorResponse('Repository not found', 404);
    }

    const repository = await prisma.repository.update({
      where: { id },
      data,
    });

    return createApiResponse(repository);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireAdmin();

    const { id } = await params;

    const existing = await prisma.repository.findUnique({ where: { id } });
    if (!existing) {
      return createErrorResponse('Repository not found', 404);
    }

    await prisma.repository.delete({ where: { id } });

    return createApiResponse({ deleted: true });
  } catch (error) {
    return handleApiError(error);
  }
}
