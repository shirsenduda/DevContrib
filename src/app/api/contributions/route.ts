import { NextRequest } from 'next/server';
import prisma from '@/lib/db';
import {
  createApiResponse,
  createErrorResponse,
  requireAuth,
  handleApiError,
  validateBody,
  parsePaginationParams,
} from '@/lib/api-helpers';
import { withRateLimit } from '@/lib/rate-limit';
import { contributionCreateSchema } from '@/types/schemas';

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();
    const { searchParams } = request.nextUrl;
    const { page, pageSize, skip } = parsePaginationParams(searchParams);
    const status = searchParams.get('status');

    const where = {
      userId: user.id,
      ...(status && { status: status as import('@prisma/client').ContributionStatus }),
    };

    const [contributions, total] = await Promise.all([
      prisma.userContribution.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: pageSize,
        include: {
          issue: {
            include: {
              repository: {
                select: {
                  fullName: true,
                  owner: true,
                  name: true,
                  language: true,
                },
              },
            },
          },
        },
      }),
      prisma.userContribution.count({ where }),
    ]);

    return createApiResponse(contributions, { total, page, pageSize });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const rateLimited = await withRateLimit(request, { maxRequests: 20, windowMs: 60_000 });
    if (rateLimited) return rateLimited;

    const user = await requireAuth();
    const body = await request.json();
    const { issueId } = validateBody(contributionCreateSchema, body);

    // Check issue exists and is open
    const issue = await prisma.issue.findUnique({
      where: { id: issueId },
      select: { id: true, isOpen: true },
    });

    if (!issue) {
      return createErrorResponse('Issue not found', 404);
    }
    if (!issue.isOpen) {
      return createErrorResponse('Issue is no longer open', 400);
    }

    // Check if user has an abandoned contribution for this issue — allow restart
    const existing = await prisma.userContribution.findUnique({
      where: { userId_issueId: { userId: user.id, issueId } },
      select: { id: true, status: true },
    });

    if (existing) {
      if (existing.status !== 'ABANDONED') {
        return createErrorResponse('You already have an active contribution for this issue', 409);
      }

      // Reset the abandoned contribution
      const contribution = await prisma.userContribution.update({
        where: { id: existing.id },
        data: {
          status: 'STARTED',
          prUrl: null,
          prNumber: null,
          prOpenedAt: null,
          mergedAt: null,
          closedAt: null,
        },
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
    }

    const contribution = await prisma.userContribution.create({
      data: {
        userId: user.id,
        issueId,
        status: 'STARTED',
      },
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
    // P2002 = unique constraint violation (concurrent request)
    if (error instanceof Error && 'code' in error && (error as unknown as { code: string }).code === 'P2002') {
      return createErrorResponse('You already have a contribution for this issue', 409);
    }
    return handleApiError(error);
  }
}
