import { NextRequest } from 'next/server';
import prisma from '@/lib/db';
import {
  createApiResponse,
  requireAuth,
  handleApiError,
  validateBody,
} from '@/lib/api-helpers';
import { userProfileSchema } from '@/types/schemas';
import { cacheDeletePattern } from '@/lib/redis';

export async function GET() {
  try {
    const user = await requireAuth();

    const profile = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        githubId: true,
        username: true,
        email: true,
        name: true,
        avatarUrl: true,
        skillLevel: true,
        preferredLanguages: true,
        bio: true,
        createdAt: true,
      },
    });

    return createApiResponse(profile);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await request.json();
    const data = validateBody(userProfileSchema, body);

    const profile = await prisma.user.update({
      where: { id: user.id },
      data: {
        skillLevel: data.skillLevel,
        preferredLanguages: data.preferredLanguages,
        bio: data.bio,
      },
      select: {
        id: true,
        username: true,
        skillLevel: true,
        preferredLanguages: true,
        bio: true,
      },
    });

    // Invalidate recommendation cache when profile changes
    await cacheDeletePattern(`recommendations:${user.id}`);

    return createApiResponse(profile);
  } catch (error) {
    return handleApiError(error);
  }
}
