import { NextRequest } from 'next/server';
import prisma from '@/lib/db';
import {
  createApiResponse,
  createErrorResponse,
  requireAuth,
  handleApiError,
  validateBody,
} from '@/lib/api-helpers';
import { contributionUpdateSchema } from '@/types/schemas';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth();
    const { id } = await params;

    const contribution = await prisma.userContribution.findFirst({
      where: { id, userId: user.id },
      include: {
        issue: {
          include: {
            repository: {
              select: { fullName: true, owner: true, name: true, language: true },
            },
          },
        },
      },
    });

    if (!contribution) {
      return createErrorResponse('Contribution not found', 404);
    }

    return createApiResponse(contribution);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireAuth();
    const { id } = await params;
    const body = await request.json();
    const data = validateBody(contributionUpdateSchema, body);

    // Verify ownership
    const existing = await prisma.userContribution.findFirst({
      where: { id, userId: user.id },
    });

    if (!existing) {
      return createErrorResponse('Contribution not found', 404);
    }

    // Block manual merge/close — only the /sync endpoint can set these
    // by verifying with the GitHub API
    if (data.status === 'PR_MERGED' || data.status === 'PR_CLOSED') {
      return createErrorResponse(
        'Cannot manually set merge/close status. Use "Sync with GitHub" to verify PR status.',
        400,
      );
    }

    // Enforce valid state transitions
    const VALID_TRANSITIONS: Record<string, string[]> = {
      STARTED: ['PR_OPENED', 'ABANDONED'],
      PR_OPENED: ['ABANDONED'],
      PR_MERGED: [],   // terminal state
      PR_CLOSED: [],   // terminal state
      ABANDONED: [],   // terminal state
    };

    const allowed = VALID_TRANSITIONS[existing.status] || [];
    if (!allowed.includes(data.status)) {
      return createErrorResponse(
        `Cannot transition from ${existing.status} to ${data.status}`,
        400,
      );
    }

    const updateData: Record<string, unknown> = { status: data.status };

    if (data.prUrl) updateData.prUrl = data.prUrl;
    if (data.prNumber) updateData.prNumber = data.prNumber;

    // Set timestamps based on status
    if (data.status === 'PR_OPENED' && !existing.prOpenedAt) {
      updateData.prOpenedAt = new Date();
    }
    if (data.status === 'ABANDONED') {
      updateData.closedAt = new Date();
    }

    const contribution = await prisma.userContribution.update({
      where: { id },
      data: updateData,
      include: {
        issue: {
          include: {
            repository: {
              select: { fullName: true, owner: true, name: true },
            },
          },
        },
      },
    });

    return createApiResponse(contribution);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireAuth();
    const { id } = await params;

    const existing = await prisma.userContribution.findFirst({
      where: { id, userId: user.id },
    });

    if (!existing) {
      return createErrorResponse('Contribution not found', 404);
    }

    await prisma.userContribution.delete({ where: { id } });

    return createApiResponse({ deleted: true });
  } catch (error) {
    return handleApiError(error);
  }
}
