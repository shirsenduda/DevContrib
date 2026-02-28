import NextAuth from 'next-auth';
import { PrismaAdapter } from '@auth/prisma-adapter';
import { prisma } from './db';
import { authConfig } from './auth.config';
import { isAdmin } from './admin';

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  adapter: PrismaAdapter(prisma),
  callbacks: {
    async jwt({ token, user, account, profile }) {
      if (user) {
        token.id = user.id;
      }
      if (account?.provider === 'github' && profile) {
        const ghProfile = profile as unknown as {
          id: number;
          login: string;
          avatar_url: string;
          name?: string;
          bio?: string;
        };
        token.githubId = ghProfile.id;
        token.username = ghProfile.login;

        if (user?.id) {
          await prisma.user.update({
            where: { id: user.id },
            data: {
              githubId: ghProfile.id,
              username: ghProfile.login,
              avatarUrl: ghProfile.avatar_url,
              name: ghProfile.name || null,
              bio: ghProfile.bio || null,
            },
          });
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token) {
        session.user.id = token.id as string;
        session.user.githubId = token.githubId as number;
        session.user.username = token.username as string;
        session.user.isAdmin = isAdmin(token.username as string);

        const dbUser = await prisma.user.findUnique({
          where: { id: token.id as string },
          select: { skillLevel: true, preferredLanguages: true },
        });
        if (dbUser) {
          session.user.skillLevel = dbUser.skillLevel;
          session.user.preferredLanguages = dbUser.preferredLanguages;
        }
      }
      return session;
    },
  },
});
