import GitHub from 'next-auth/providers/github';
import type { NextAuthConfig } from 'next-auth';

// Shared auth config - edge-compatible (no Prisma/DB imports)
// Used by both middleware and the full auth.ts
export const authConfig: NextAuthConfig = {
  trustHost: true,
  session: { strategy: 'jwt' },
  providers: [
    GitHub({
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
      authorization: {
        params: {
          scope: 'read:user user:email public_repo',
        },
      },
    }),
  ],
  pages: {
    signIn: '/login',
  },
};
