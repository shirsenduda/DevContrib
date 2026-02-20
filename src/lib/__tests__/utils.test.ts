import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { formatDate, formatRelativeTime, truncate, slugify } from '../utils';

describe('formatDate', () => {
  it('returns dash for null', () => {
    expect(formatDate(null)).toBe('\u2014');
  });

  it('returns dash for undefined', () => {
    expect(formatDate(undefined)).toBe('\u2014');
  });

  it('returns dash for invalid date string', () => {
    expect(formatDate('not-a-date')).toBe('\u2014');
  });

  it('formats a valid Date object', () => {
    const result = formatDate(new Date('2025-01-15T00:00:00Z'));
    expect(result).toContain('Jan');
    expect(result).toContain('15');
    expect(result).toContain('2025');
  });

  it('formats a valid ISO string', () => {
    const result = formatDate('2025-06-20T12:00:00Z');
    expect(result).toContain('Jun');
    expect(result).toContain('20');
    expect(result).toContain('2025');
  });
});

describe('formatRelativeTime', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2025-06-15T12:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns dash for null', () => {
    expect(formatRelativeTime(null)).toBe('\u2014');
  });

  it('returns dash for undefined', () => {
    expect(formatRelativeTime(undefined)).toBe('\u2014');
  });

  it('returns dash for invalid date', () => {
    expect(formatRelativeTime('garbage')).toBe('\u2014');
  });

  it('returns relative time for recent date', () => {
    const fiveMinutesAgo = new Date('2025-06-15T11:55:00Z');
    const result = formatRelativeTime(fiveMinutesAgo);
    expect(result).toContain('minutes ago');
  });

  it('returns relative time for date days ago', () => {
    const threeDaysAgo = new Date('2025-06-12T12:00:00Z');
    const result = formatRelativeTime(threeDaysAgo);
    expect(result).toContain('days ago');
  });
});

describe('truncate', () => {
  it('returns unchanged string shorter than limit', () => {
    expect(truncate('hello', 10)).toBe('hello');
  });

  it('returns unchanged string at exact limit', () => {
    expect(truncate('hello', 5)).toBe('hello');
  });

  it('truncates string longer than limit', () => {
    expect(truncate('hello world', 5)).toBe('hello...');
  });

  it('handles empty string', () => {
    expect(truncate('', 10)).toBe('');
  });
});

describe('slugify', () => {
  it('converts to lowercase with hyphens', () => {
    expect(slugify('Hello World')).toBe('hello-world');
  });

  it('removes special characters', () => {
    expect(slugify('Special @#$ Characters!')).toBe('special-characters');
  });

  it('trims leading and trailing hyphens', () => {
    expect(slugify('  hello  ')).toBe('hello');
  });

  it('collapses multiple spaces into single hyphens', () => {
    expect(slugify('Multiple   Spaces')).toBe('multiple-spaces');
  });

  it('handles already slugified string', () => {
    expect(slugify('already-slugified')).toBe('already-slugified');
  });
});
