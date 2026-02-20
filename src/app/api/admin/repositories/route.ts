import { NextRequest } from 'next/server';
import { z } from 'zod/v4';
import prisma from '@/lib/db';
import { requireAdmin } from '@/lib/admin';
import {
  createApiResponse,
  createErrorResponse,
  parsePaginationParams,
  validateBody,
  handleApiError,
} from '@/lib/api-helpers';
import { getRepository } from '@/lib/github';
import { calculateRepoHealthScore } from '@/services/scoring';
import type { Prisma } from '@prisma/client';

const addRepoSchema = z.object({
  url: z
    .string()
    .url()
    .refine(
      (url) => {
        try {
          const parsed = new URL(url);
          const parts = parsed.pathname.split('/').filter(Boolean);
          return parsed.hostname === 'github.com' && parts.length >= 2;
        } catch {
          return false;
        }
      },
      { message: 'Must be a valid GitHub repository URL (e.g., https://github.com/owner/repo)' },
    ),
});

export async function GET(request: NextRequest) {
  try {
    await requireAdmin();

    const { searchParams } = request.nextUrl;
    const { page, pageSize, skip } = parsePaginationParams(searchParams);
    const search = searchParams.get('search');
    const isActive = searchParams.get('isActive');
    const language = searchParams.get('language');
    const sortBy = searchParams.get('sortBy') || 'healthScore';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    const where: Prisma.RepositoryWhereInput = {
      ...(search && { fullName: { contains: search, mode: 'insensitive' as const } }),
      ...(isActive !== null && isActive !== undefined && isActive !== '' && { isActive: isActive === 'true' }),
      ...(language && { language }),
    };

    const orderBy: Prisma.RepositoryOrderByWithRelationInput = {
      [sortBy]: sortOrder,
    };

    const [repositories, total] = await Promise.all([
      prisma.repository.findMany({
        where,
        orderBy,
        skip,
        take: pageSize,
        include: {
          _count: { select: { issues: true } },
        },
      }),
      prisma.repository.count({ where }),
    ]);

    return createApiResponse(repositories, { total, page, pageSize });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAdmin();

    const body = await request.json();
    const { url } = validateBody(addRepoSchema, body);

    const parsed = new URL(url);
    const parts = parsed.pathname.split('/').filter(Boolean);
    const owner = parts[0];
    const name = parts[1];

    // Fetch repo metadata from GitHub
    let repoData;
    try {
      repoData = await getRepository(owner, name);
    } catch {
      return createErrorResponse(`Repository ${owner}/${name} not found on GitHub`, 404);
    }

    const healthScore = calculateRepoHealthScore({
      stars: repoData.stargazerCount,
      forks: repoData.forkCount,
      openIssuesCount: repoData.issues.totalCount,
      updatedAt: repoData.updatedAt,
    });

    const repository = await prisma.repository.upsert({
      where: { githubId: repoData.databaseId },
      update: {
        fullName: repoData.nameWithOwner,
        description: repoData.description,
        language: repoData.primaryLanguage?.name || null,
        languages: repoData.languages.nodes.map((l) => l.name),
        stars: repoData.stargazerCount,
        forks: repoData.forkCount,
        openIssuesCount: repoData.issues.totalCount,
        healthScore,
        lastScrapedAt: new Date(),
        isActive: true,
      },
      create: {
        githubId: repoData.databaseId,
        fullName: repoData.nameWithOwner,
        owner: repoData.owner.login,
        name: repoData.name,
        description: repoData.description,
        language: repoData.primaryLanguage?.name || null,
        languages: repoData.languages.nodes.map((l) => l.name),
        stars: repoData.stargazerCount,
        forks: repoData.forkCount,
        openIssuesCount: repoData.issues.totalCount,
        healthScore,
        lastScrapedAt: new Date(),
      },
    });

    return createApiResponse(repository);
  } catch (error) {
    return handleApiError(error);
  }
}
