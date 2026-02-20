import { redis } from './redis';
import { NextResponse } from 'next/server';

interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
  keyPrefix: string;
}

const DEFAULT_CONFIG: RateLimitConfig = {
  windowMs: 60_000,
  maxRequests: 60,
  keyPrefix: 'rl:api',
};

export async function checkRateLimit(
  identifier: string,
  config: Partial<RateLimitConfig> = {},
): Promise<{ allowed: boolean; remaining: number; resetAt: number }> {
  const opts = { ...DEFAULT_CONFIG, ...config };
  const key = `${opts.keyPrefix}:${identifier}`;
  const now = Date.now();
  const windowStart = now - opts.windowMs;

  try {
    const pipeline = redis.pipeline();
    pipeline.zremrangebyscore(key, 0, windowStart);
    pipeline.zadd(key, now, `${now}-${Math.random()}`);
    pipeline.zcard(key);
    pipeline.pexpire(key, opts.windowMs);
    const results = await pipeline.exec();

    const count = (results?.[2]?.[1] as number) ?? 0;
    const allowed = count <= opts.maxRequests;
    const remaining = Math.max(0, opts.maxRequests - count);
    const resetAt = now + opts.windowMs;

    return { allowed, remaining, resetAt };
  } catch {
    // If Redis is down, allow the request (fail open)
    return { allowed: true, remaining: opts.maxRequests, resetAt: now + opts.windowMs };
  }
}

export async function withRateLimit(
  request: Request,
  config: { windowMs?: number; maxRequests?: number } = {},
): Promise<NextResponse | null> {
  const headers = request.headers;
  const ip =
    headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    headers.get('x-real-ip') ||
    'unknown';

  const maxRequests = config.maxRequests ?? 60;
  const result = await checkRateLimit(ip, {
    windowMs: config.windowMs ?? 60_000,
    maxRequests,
    keyPrefix: 'rl:api',
  });

  if (!result.allowed) {
    return NextResponse.json(
      { error: 'Too Many Requests', message: 'Rate limit exceeded' },
      {
        status: 429,
        headers: {
          'Retry-After': String(Math.ceil((result.resetAt - Date.now()) / 1000)),
          'X-RateLimit-Limit': String(maxRequests),
          'X-RateLimit-Remaining': '0',
        },
      },
    );
  }

  return null;
}
