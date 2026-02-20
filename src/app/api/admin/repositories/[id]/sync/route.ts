import { NextRequest } from 'next/server';
import prisma from '@/lib/db';
import { requireAdmin } from '@/lib/admin';
import { createApiResponse, createErrorResponse, handleApiError } from '@/lib/api-helpers';
import { syncIssuesForRepo } from '@/services/github-sync';

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireAdmin();

    const { id } = await params;

    const repo = await prisma.repository.findUnique({
      where: { id },
      select: { id: true, owner: true, name: true, healthScore: true },
    });

    if (!repo) {
      return createErrorResponse('Repository not found', 404);
    }

    const result = await syncIssuesForRepo(repo.id, repo.owner, repo.name, repo.healthScore);

    return createApiResponse(result);
  } catch (error) {
    return handleApiError(error);
  }
}
