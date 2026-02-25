import Redis from 'ioredis';
import { logger } from './logger';

const getRedisUrl = () => {
  if (process.env.REDIS_URL) return process.env.REDIS_URL;
  return 'redis://localhost:6379';
};

export const redis = new Redis(getRedisUrl(), {
  maxRetriesPerRequest: null, // Required by BullMQ
  enableReadyCheck: false,
});

redis.on('error', (err) => logger.error({ err }, 'Redis connection error'));
redis.on('connect', () => logger.info('Redis connected'));

/* ─── Cache versioning (replaces expensive KEYS-based pattern deletion) ─── */

const versionCache = new Map<string, { version: number; expiresAt: number }>();
const VERSION_LOCAL_TTL = 5 * 60_000; // Cache version locally for 5 minutes

async function getCacheVersion(namespace: string): Promise<number> {
  const cached = versionCache.get(namespace);
  if (cached && Date.now() < cached.expiresAt) {
    return cached.version;
  }

  try {
    const version = parseInt(await redis.get(`_ver:${namespace}`) || '0', 10);
    versionCache.set(namespace, { version, expiresAt: Date.now() + VERSION_LOCAL_TTL });
    return version;
  } catch {
    return 0;
  }
}

async function versionedKey(key: string): Promise<string> {
  const namespace = key.split(':')[0];
  const version = await getCacheVersion(namespace);
  return `v${version}:${key}`;
}

/**
 * Invalidate all cached data for the given namespaces.
 * Increments a version counter so old keys are ignored and expire naturally via TTL.
 * Replaces the expensive KEYS + DEL pattern scan (O(N) → O(1) per namespace).
 */
export async function invalidateCache(...namespaces: string[]): Promise<void> {
  try {
    for (const ns of namespaces) {
      await redis.incr(`_ver:${ns}`);
      versionCache.delete(ns);
    }
  } catch (err) {
    logger.warn({ err, namespaces }, 'Redis invalidateCache failed');
  }
}

export async function cacheGet<T>(key: string): Promise<T | null> {
  try {
    const vKey = await versionedKey(key);
    const data = await redis.get(vKey);
    return data ? JSON.parse(data) : null;
  } catch (err) {
    logger.warn({ err, key }, 'Redis cacheGet failed, skipping cache');
    return null;
  }
}

export async function cacheSet(key: string, data: unknown, ttlSeconds = 300): Promise<void> {
  try {
    const vKey = await versionedKey(key);
    await redis.set(vKey, JSON.stringify(data), 'EX', ttlSeconds);
  } catch (err) {
    logger.warn({ err, key }, 'Redis cacheSet failed, skipping cache');
  }
}

export async function cacheDelete(key: string): Promise<void> {
  try {
    const vKey = await versionedKey(key);
    await redis.del(vKey);
  } catch (err) {
    logger.warn({ err, key }, 'Redis cacheDelete failed');
  }
}
