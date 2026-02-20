import { requireAuth } from './api-helpers';

const ADMIN_USERNAMES = (process.env.ADMIN_USERNAMES || '').split(',').filter(Boolean).map(s => s.trim().toLowerCase());

export class AdminError extends Error {
  constructor(message = 'Admin access required') {
    super(message);
    this.name = 'AdminError';
  }
}

export async function requireAdmin() {
  const user = await requireAuth();
  if (ADMIN_USERNAMES.length === 0 || !ADMIN_USERNAMES.includes(user.username!.toLowerCase())) {
    throw new AdminError();
  }
  return user;
}

export function isAdmin(username: string | null | undefined): boolean {
  if (!username) return false;
  return ADMIN_USERNAMES.length > 0 && ADMIN_USERNAMES.includes(username.toLowerCase());
}
