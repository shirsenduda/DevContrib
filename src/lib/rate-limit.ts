import { NextRequest, NextResponse } from 'next/server';

/**
 * Simple in-memory rate limiter for API routes.
 * Tracks requests per IP with a sliding window.
 */
const ipRequestMap = new Map<string, { count: number; resetTime: number }>();

// Clean up stale entries every 5 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [key, value] of ipRequestMap) {
      if (now > value.resetTime) {
        ipRequestMap.delete(key);
      }
    }
  }, 5 * 60 * 1000);
}

/**
 * Rate limit an API request. Returns a 429 response if limit exceeded,
 * or null if the request is allowed.
 *
 * Usage:
 *   const rateLimited = await withRateLimit(request, { maxRequests: 20, windowMs: 60_000 });
 *   if (rateLimited) return rateLimited;
 */
export async function withRateLimit(
  request: NextRequest,
  { maxRequests = 60, windowMs = 60_000 }: { maxRequests?: number; windowMs?: number } = {},
): Promise<NextResponse | null> {
  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    '127.0.0.1';

  const now = Date.now();
  const record = ipRequestMap.get(ip);

  if (!record || now > record.resetTime) {
    ipRequestMap.set(ip, { count: 1, resetTime: now + windowMs });
    return null;
  }

  record.count++;

  if (record.count > maxRequests) {
    return NextResponse.json(
      { error: 'Too many requests. Please try again later.' },
      {
        status: 429,
        headers: {
          'Retry-After': String(Math.ceil(windowMs / 1000)),
          'X-RateLimit-Limit': String(maxRequests),
          'X-RateLimit-Remaining': '0',
        },
      },
    );
  }

  return null;
}
