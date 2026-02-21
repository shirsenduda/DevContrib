import { NextRequest, NextResponse } from 'next/server';
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

/**
 * Distributed rate limiter using Upstash Redis.
 * Works across all serverless instances — handles 1000+ concurrent users.
 *
 * Uses sliding-window algorithm for accurate, fair rate limiting.
 * Falls back to in-memory if Redis is not configured (local dev).
 */

/* ─── Upstash Redis client (separate from ioredis used by BullMQ) ─── */
function getUpstashRedis(): Redis | null {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) return null;

  return new Redis({ url, token });
}

/* ─── Rate limiter instances (cached per cold start) ─── */
const limiters = new Map<string, Ratelimit>();

function getLimiter(maxRequests: number, windowMs: number): Ratelimit | null {
  const redis = getUpstashRedis();
  if (!redis) return null;

  const key = `${maxRequests}:${windowMs}`;
  if (limiters.has(key)) return limiters.get(key)!;

  const windowSec = `${Math.ceil(windowMs / 1000)} s` as `${number} s`;
  const limiter = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(maxRequests, windowSec),
    analytics: true,
    prefix: 'ratelimit',
  });

  limiters.set(key, limiter);
  return limiter;
}

/* ─── In-memory fallback for local development ─── */
const ipRequestMap = new Map<string, { count: number; resetTime: number }>();

function inMemoryCheck(
  ip: string,
  maxRequests: number,
  windowMs: number,
): { success: boolean; remaining: number } {
  const now = Date.now();
  const record = ipRequestMap.get(ip);

  if (!record || now > record.resetTime) {
    ipRequestMap.set(ip, { count: 1, resetTime: now + windowMs });
    return { success: true, remaining: maxRequests - 1 };
  }

  record.count++;
  if (record.count > maxRequests) {
    return { success: false, remaining: 0 };
  }
  return { success: true, remaining: maxRequests - record.count };
}

/* ─── Main export ─── */

/**
 * Rate limit an API request. Returns a 429 response if limit exceeded,
 * or null if the request is allowed.
 *
 * - Production: Uses Upstash Redis (distributed, works across all instances)
 * - Development: Falls back to in-memory
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

  const limiter = getLimiter(maxRequests, windowMs);

  let success: boolean;
  let remaining: number;

  if (limiter) {
    // Production: distributed Redis rate limiting
    const result = await limiter.limit(ip);
    success = result.success;
    remaining = result.remaining;
  } else {
    // Development fallback: in-memory
    const result = inMemoryCheck(ip, maxRequests, windowMs);
    success = result.success;
    remaining = result.remaining;
  }

  if (!success) {
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
