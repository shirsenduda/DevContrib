import { NextRequest } from 'next/server';
import prisma from '@/lib/db';
import { getPullRequestStatus } from '@/lib/github';
import {
  createApiResponse,
  createErrorResponse,
  requireAuth,
  handleApiError,
} from '@/lib/api-helpers';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireAuth();
    const { id } = await params;

    // Get contribution with repo info
    const contribution = await prisma.userContribution.findFirst({
      where: { id, userId: user.id },
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

    if (!contribution) {
      return createErrorResponse('Contribution not found', 404);
    }

    if (!contribution.prUrl || !contribution.prNumber) {
      return createErrorResponse('No PR linked to this contribution. Submit your PR URL first.', 400);
    }

    // Parse owner/repo from the PR URL to handle cross-repo PRs correctly
    const prUrlMatch = contribution.prUrl.match(
      /github\.com\/([^/]+)\/([^/]+)\/pull\/(\d+)/,
    );

    if (!prUrlMatch) {
      return createErrorResponse('Invalid PR URL format', 400);
    }

    const [, prOwner, prRepo] = prUrlMatch;

    // Fetch real status from GitHub API
    const prStatus = await getPullRequestStatus(prOwner, prRepo, contribution.prNumber);

    // Map GitHub status to our ContributionStatus
    const updateData: Record<string, unknown> = {};

    if (prStatus.merged) {
      updateData.status = 'PR_MERGED';
      updateData.mergedAt = prStatus.mergedAt ? new Date(prStatus.mergedAt) : new Date();
    } else if (prStatus.state === 'closed') {
      updateData.status = 'PR_CLOSED';
      updateData.closedAt = prStatus.closedAt ? new Date(prStatus.closedAt) : new Date();
    } else {
      // Still open
      updateData.status = 'PR_OPENED';
    }

    const updated = await prisma.userContribution.update({
      where: { id },
      data: updateData,
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

    return createApiResponse({
      ...updated,
      githubStatus: prStatus.state,
      githubMerged: prStatus.merged,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
