import type { DefaultSession } from 'next-auth';
import type { SkillLevel } from '@prisma/client';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      githubId: number;
      username: string;
      skillLevel: SkillLevel;
      preferredLanguages: string[];
      isAdmin: boolean;
    } & DefaultSession['user'];
  }
}
