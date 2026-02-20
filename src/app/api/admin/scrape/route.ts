import { NextRequest } from 'next/server';
import { createApiResponse, createErrorResponse, requireAuth, handleApiError } from '@/lib/api-helpers';
import { withRateLimit } from '@/lib/rate-limit';
import { scrapeQueue } from '@/jobs/queues';

const ADMIN_USERNAMES = (process.env.ADMIN_USERNAMES || '').split(',').filter(Boolean);

export async function POST(request: NextRequest) {
  try {
    const rateLimited = await withRateLimit(request, { maxRequests: 5, windowMs: 60_000 });
    if (rateLimited) return rateLimited;

    const user = await requireAuth();

    // Check admin access — deny by default if no admins configured
    if (ADMIN_USERNAMES.length === 0 || !ADMIN_USERNAMES.includes(user.username)) {
      return createErrorResponse('Admin access required', 403);
    }

    const job = await scrapeQueue.add('manual-scrape', {
      triggeredBy: user.username,
      triggeredAt: new Date().toISOString(),
    });

    return createApiResponse({
      jobId: job.id,
      message: 'Scrape job queued successfully',
    });
  } catch (error) {
    return handleApiError(error);
  }
}
