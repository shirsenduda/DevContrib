import { describe, it, expect, vi } from 'vitest';

// Mock auth to avoid next-auth → next/server import chain
vi.mock('../auth', () => ({
  auth: vi.fn(),
}));

import { parsePaginationParams } from '../api-helpers';

describe('parsePaginationParams', () => {
  it('returns defaults when no params provided', () => {
    const params = new URLSearchParams();
    const result = parsePaginationParams(params);
    expect(result).toEqual({ page: 1, pageSize: 20, skip: 0 });
  });

  it('parses custom page and pageSize', () => {
    const params = new URLSearchParams({ page: '3', pageSize: '50' });
    const result = parsePaginationParams(params);
    expect(result).toEqual({ page: 3, pageSize: 50, skip: 100 });
  });

  it('clamps page to minimum 1', () => {
    const params = new URLSearchParams({ page: '-5' });
    const result = parsePaginationParams(params);
    expect(result.page).toBe(1);
  });

  it('clamps pageSize to maximum 100', () => {
    const params = new URLSearchParams({ pageSize: '500' });
    const result = parsePaginationParams(params);
    expect(result.pageSize).toBe(100);
  });

  it('clamps pageSize to minimum 1', () => {
    const params = new URLSearchParams({ pageSize: '0' });
    const result = parsePaginationParams(params);
    expect(result.pageSize).toBe(1);
  });

  it('handles non-numeric strings gracefully', () => {
    const params = new URLSearchParams({ page: 'abc', pageSize: 'xyz' });
    const result = parsePaginationParams(params);
    expect(result.page).toBe(1);
    expect(result.pageSize).toBe(1);
  });

  it('calculates skip correctly', () => {
    const params = new URLSearchParams({ page: '5', pageSize: '10' });
    const result = parsePaginationParams(params);
    expect(result.skip).toBe(40);
  });
});
