import { NextRequest } from 'next/server';
import { createApiResponse, createErrorResponse, requireAuth, handleApiError } from '@/lib/api-helpers';
import { withRateLimit } from '@/lib/rate-limit';
import { logger } from '@/lib/logger';

const ADMIN_USERNAMES = (process.env.ADMIN_USERNAMES || '').split(',').filter(Boolean);

export async function POST(request: NextRequest) {
  try {
    const rateLimited = await withRateLimit(request, { maxRequests: 5, windowMs: 60_000 });
    if (rateLimited) return rateLimited;

    const user = await requireAuth();

    if (ADMIN_USERNAMES.length === 0 || !ADMIN_USERNAMES.includes(user.username)) {
      return createErrorResponse('Admin access required', 403);
    }

    // Trigger the GitHub Actions scrape workflow
    const ghToken = process.env.GITHUB_PERSONAL_ACCESS_TOKEN;
    const repo = process.env.GITHUB_REPO; // e.g. "username/dev-contrib-platform"

    if (!ghToken || !repo) {
      return createErrorResponse('GITHUB_PERSONAL_ACCESS_TOKEN and GITHUB_REPO env vars required', 500);
    }

    const res = await fetch(
      `https://api.github.com/repos/${repo}/actions/workflows/cron-jobs.yml/dispatches`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${ghToken}`,
          Accept: 'application/vnd.github.v3+json',
        },
        body: JSON.stringify({
          ref: 'main',
          inputs: { job: 'scrape' },
        }),
      },
    );

    if (!res.ok) {
      const body = await res.text();
      logger.error({ status: res.status, body }, 'Failed to trigger GitHub Actions workflow');
      return createErrorResponse('Failed to trigger scrape workflow', 500);
    }

    logger.info({ triggeredBy: user.username }, 'Scrape workflow triggered via GitHub Actions');

    return createApiResponse({
      message: 'Scrape triggered — running via GitHub Actions. Check Scrape Logs in a few minutes.',
    });
  } catch (error) {
    return handleApiError(error);
  }
}
