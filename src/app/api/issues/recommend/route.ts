import { NextRequest } from 'next/server';
import { createApiResponse, requireAuth, handleApiError } from '@/lib/api-helpers';
import { getRecommendations } from '@/services/recommendation';

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();
    const { searchParams } = request.nextUrl;
    const rawCount = parseInt(searchParams.get('count') || '5', 10);
    const count = Number.isNaN(rawCount) ? 5 : Math.max(1, Math.min(20, rawCount));

    const recommendations = await getRecommendations(user.id, count);

    return createApiResponse(recommendations);
  } catch (error) {
    return handleApiError(error);
  }
}
