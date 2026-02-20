import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock api-helpers to avoid next-auth → next/server import chain
vi.mock('../api-helpers', () => ({
  requireAuth: vi.fn(),
}));

describe('isAdmin', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('returns false for null username', async () => {
    process.env.ADMIN_USERNAMES = 'admin1,admin2';
    const { isAdmin } = await import('../admin');
    expect(isAdmin(null)).toBe(false);
  });

  it('returns false for undefined username', async () => {
    process.env.ADMIN_USERNAMES = 'admin1,admin2';
    const { isAdmin } = await import('../admin');
    expect(isAdmin(undefined)).toBe(false);
  });

  it('returns false for empty string username', async () => {
    process.env.ADMIN_USERNAMES = 'admin1';
    const { isAdmin } = await import('../admin');
    expect(isAdmin('')).toBe(false);
  });

  it('returns false when ADMIN_USERNAMES is empty', async () => {
    process.env.ADMIN_USERNAMES = '';
    const { isAdmin } = await import('../admin');
    expect(isAdmin('someuser')).toBe(false);
  });

  it('returns true when username is in admin list', async () => {
    process.env.ADMIN_USERNAMES = 'admin1,admin2,admin3';
    const { isAdmin } = await import('../admin');
    expect(isAdmin('admin2')).toBe(true);
  });

  it('returns false when username is not in admin list', async () => {
    process.env.ADMIN_USERNAMES = 'admin1,admin2';
    const { isAdmin } = await import('../admin');
    expect(isAdmin('notadmin')).toBe(false);
  });
});
