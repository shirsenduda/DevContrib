import { logger } from './logger';

interface RetryOptions {
  maxRetries: number;
  baseDelayMs: number;
  maxDelayMs: number;
  retryableStatuses: number[];
}

const DEFAULTS: RetryOptions = {
  maxRetries: 3,
  baseDelayMs: 1000,
  maxDelayMs: 60000,
  retryableStatuses: [403, 429, 500, 502, 503],
};

function extractStatus(error: unknown): number | null {
  if (typeof error === 'object' && error !== null && 'status' in error) {
    return (error as { status: number }).status;
  }
  return null;
}

function extractRetryAfter(error: unknown): number | null {
  if (
    typeof error === 'object' &&
    error !== null &&
    'response' in error
  ) {
    const response = (error as { response?: { headers?: Record<string, string> } }).response;
    const value = response?.headers?.['retry-after'];
    if (value) {
      const seconds = parseInt(value, 10);
      return isNaN(seconds) ? null : seconds;
    }
  }
  return null;
}

function isNetworkError(error: unknown): boolean {
  if (error instanceof Error) {
    const msg = error.message;
    return (
      msg.includes('ETIMEDOUT') ||
      msg.includes('ECONNRESET') ||
      msg.includes('ECONNREFUSED') ||
      msg.includes('socket hang up') ||
      msg.includes('fetch failed')
    );
  }
  return false;
}

export async function withRetry<T>(
  fn: () => Promise<T>,
  options: Partial<RetryOptions> = {},
): Promise<T> {
  const opts = { ...DEFAULTS, ...options };

  for (let attempt = 0; attempt <= opts.maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error: unknown) {
      const status = extractStatus(error);
      const isRetryable =
        status !== null && opts.retryableStatuses.includes(status);

      if (attempt === opts.maxRetries || (!isRetryable && !isNetworkError(error))) {
        throw error;
      }

      let delay = opts.baseDelayMs * Math.pow(2, attempt);
      const retryAfter = extractRetryAfter(error);
      if (retryAfter) {
        delay = Math.max(delay, retryAfter * 1000);
      }
      delay = Math.min(delay, opts.maxDelayMs);
      // Add jitter: +/- 25%
      delay = delay * (0.75 + Math.random() * 0.5);

      logger.warn(
        {
          attempt: attempt + 1,
          maxRetries: opts.maxRetries,
          status,
          delayMs: Math.round(delay),
        },
        'GitHub API call failed, retrying',
      );

      await new Promise((r) => setTimeout(r, delay));
    }
  }

  throw new Error('Retry loop exited unexpectedly');
}
