import { PrismaClient, Difficulty, SkillLevel, ContributionStatus } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import * as fs from 'node:fs';
import * as path from 'node:path';

// Load .env file for DATABASE_URL
const envPath = path.join(__dirname, '..', '.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8');
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const eqIndex = trimmed.indexOf('=');
      if (eqIndex > 0) {
        const key = trimmed.substring(0, eqIndex).trim();
        const value = trimmed.substring(eqIndex + 1).trim();
        if (!process.env[key]) {
          process.env[key] = value;
        }
      }
    }
  }
}

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL! });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Seeding database...');

  // Create sample repositories
  const repos = await Promise.all([
    prisma.repository.upsert({
      where: { githubId: 10270250 },
      update: {},
      create: {
        githubId: 10270250,
        fullName: 'facebook/react',
        owner: 'facebook',
        name: 'react',
        description: 'The library for web and native user interfaces.',
        language: 'JavaScript',
        languages: ['JavaScript', 'TypeScript', 'HTML'],
        stars: 220000,
        forks: 45000,
        openIssuesCount: 850,
        healthScore: 92,
        isActive: true,
      },
    }),
    prisma.repository.upsert({
      where: { githubId: 70107786 },
      update: {},
      create: {
        githubId: 70107786,
        fullName: 'vercel/next.js',
        owner: 'vercel',
        name: 'next.js',
        description: 'The React Framework',
        language: 'JavaScript',
        languages: ['JavaScript', 'TypeScript', 'Rust'],
        stars: 120000,
        forks: 26000,
        openIssuesCount: 2400,
        healthScore: 88,
        isActive: true,
      },
    }),
    prisma.repository.upsert({
      where: { githubId: 29028775 },
      update: {},
      create: {
        githubId: 29028775,
        fullName: 'microsoft/TypeScript',
        owner: 'microsoft',
        name: 'TypeScript',
        description: 'TypeScript is a superset of JavaScript that compiles to clean JavaScript output.',
        language: 'TypeScript',
        languages: ['TypeScript', 'JavaScript'],
        stars: 97000,
        forks: 12000,
        openIssuesCount: 5800,
        healthScore: 85,
        isActive: true,
      },
    }),
    prisma.repository.upsert({
      where: { githubId: 65750241 },
      update: {},
      create: {
        githubId: 65750241,
        fullName: 'prisma/prisma',
        owner: 'prisma',
        name: 'prisma',
        description: 'Next-generation ORM for Node.js & TypeScript',
        language: 'TypeScript',
        languages: ['TypeScript', 'Rust'],
        stars: 37000,
        forks: 1400,
        openIssuesCount: 3200,
        healthScore: 90,
        isActive: true,
      },
    }),
    prisma.repository.upsert({
      where: { githubId: 126260328 },
      update: {},
      create: {
        githubId: 126260328,
        fullName: 'tailwindlabs/tailwindcss',
        owner: 'tailwindlabs',
        name: 'tailwindcss',
        description: 'A utility-first CSS framework for rapid UI development.',
        language: 'TypeScript',
        languages: ['TypeScript', 'CSS', 'JavaScript'],
        stars: 78000,
        forks: 3900,
        openIssuesCount: 150,
        healthScore: 95,
        isActive: true,
      },
    }),
  ]);

  console.log(`Created ${repos.length} repositories`);

  // Create sample issues
  const issues = await Promise.all([
    prisma.issue.upsert({
      where: { githubId: 100001 },
      update: {},
      create: {
        githubId: 100001,
        repoId: repos[0].id,
        number: 28432,
        title: 'Fix accessibility issue in Dialog component',
        body: 'The Dialog component does not properly trap focus when opened. This is a good first issue for someone familiar with ARIA patterns.',
        labels: ['good first issue', 'accessibility', 'Component: Dialog'],
        difficulty: Difficulty.EASY,
        mergeProbability: 0.85,
        isAssigned: false,
        isOpen: true,
        commentCount: 3,
        createdAtGithub: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
        updatedAtGithub: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      },
    }),
    prisma.issue.upsert({
      where: { githubId: 100002 },
      update: {},
      create: {
        githubId: 100002,
        repoId: repos[1].id,
        number: 61234,
        title: 'Add support for custom 404 page in App Router',
        body: 'Currently the not-found.tsx page does not support dynamic metadata. Help wanted to add this feature.',
        labels: ['help wanted', 'app-router', 'enhancement'],
        difficulty: Difficulty.MEDIUM,
        mergeProbability: 0.72,
        isAssigned: false,
        isOpen: true,
        commentCount: 8,
        createdAtGithub: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000),
        updatedAtGithub: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      },
    }),
    prisma.issue.upsert({
      where: { githubId: 100003 },
      update: {},
      create: {
        githubId: 100003,
        repoId: repos[2].id,
        number: 57890,
        title: 'Improve error message for circular type references',
        body: 'The error message when TypeScript detects a circular type reference is not very helpful. We should include the full type chain.',
        labels: ['good first issue', 'help wanted', 'Error Messages'],
        difficulty: Difficulty.MEDIUM,
        mergeProbability: 0.68,
        isAssigned: false,
        isOpen: true,
        commentCount: 5,
        createdAtGithub: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
        updatedAtGithub: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
      },
    }),
    prisma.issue.upsert({
      where: { githubId: 100004 },
      update: {},
      create: {
        githubId: 100004,
        repoId: repos[3].id,
        number: 22345,
        title: 'Add JSON field filtering documentation',
        body: 'The documentation for filtering on JSON fields is incomplete. We need examples for nested JSON queries.',
        labels: ['good first issue', 'docs', 'prisma-client'],
        difficulty: Difficulty.EASY,
        mergeProbability: 0.92,
        isAssigned: false,
        isOpen: true,
        commentCount: 2,
        createdAtGithub: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000),
        updatedAtGithub: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      },
    }),
    prisma.issue.upsert({
      where: { githubId: 100005 },
      update: {},
      create: {
        githubId: 100005,
        repoId: repos[4].id,
        number: 13456,
        title: 'Support for container queries in utility classes',
        body: 'Add utility classes for CSS container queries. This is a significant feature addition.',
        labels: ['help wanted', 'enhancement', 'css'],
        difficulty: Difficulty.HARD,
        mergeProbability: 0.55,
        isAssigned: false,
        isOpen: true,
        commentCount: 15,
        createdAtGithub: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
        updatedAtGithub: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      },
    }),
    prisma.issue.upsert({
      where: { githubId: 100006 },
      update: {},
      create: {
        githubId: 100006,
        repoId: repos[0].id,
        number: 28500,
        title: 'Add unit tests for useTransition hook edge cases',
        body: 'We need more test coverage for the useTransition hook, particularly around concurrent mode edge cases.',
        labels: ['good first issue', 'testing'],
        difficulty: Difficulty.EASY,
        mergeProbability: 0.88,
        isAssigned: false,
        isOpen: true,
        commentCount: 1,
        createdAtGithub: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        updatedAtGithub: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      },
    }),
    prisma.issue.upsert({
      where: { githubId: 100007 },
      update: {},
      create: {
        githubId: 100007,
        repoId: repos[1].id,
        number: 61500,
        title: 'Optimize image loading in production builds',
        body: 'Images loaded through next/image are not optimally cached in production. We need to review the caching strategy.',
        labels: ['help wanted', 'performance', 'Image'],
        difficulty: Difficulty.HARD,
        mergeProbability: 0.45,
        isAssigned: false,
        isOpen: true,
        commentCount: 12,
        createdAtGithub: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        updatedAtGithub: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      },
    }),
  ]);

  console.log(`Created ${issues.length} issues`);

  // Create a test user
  const testUser = await prisma.user.upsert({
    where: { githubId: 99999 },
    update: {},
    create: {
      githubId: 99999,
      username: 'testdev',
      email: 'test@example.com',
      name: 'Test Developer',
      avatarUrl: 'https://avatars.githubusercontent.com/u/99999',
      skillLevel: SkillLevel.INTERMEDIATE,
      preferredLanguages: ['TypeScript', 'JavaScript'],
      bio: 'A test developer for seeding purposes.',
    },
  });

  console.log(`Created test user: ${testUser.username}`);

  // Create sample contributions
  await prisma.userContribution.upsert({
    where: {
      userId_issueId: {
        userId: testUser.id,
        issueId: issues[0].id,
      },
    },
    update: {},
    create: {
      userId: testUser.id,
      issueId: issues[0].id,
      status: ContributionStatus.PR_MERGED,
      prUrl: 'https://github.com/facebook/react/pull/28433',
      prNumber: 28433,
      startedAt: new Date('2024-02-01'),
      prOpenedAt: new Date('2024-02-03'),
      mergedAt: new Date('2024-02-10'),
    },
  });

  await prisma.userContribution.upsert({
    where: {
      userId_issueId: {
        userId: testUser.id,
        issueId: issues[3].id,
      },
    },
    update: {},
    create: {
      userId: testUser.id,
      issueId: issues[3].id,
      status: ContributionStatus.PR_OPENED,
      prUrl: 'https://github.com/prisma/prisma/pull/22346',
      prNumber: 22346,
      startedAt: new Date('2024-03-10'),
      prOpenedAt: new Date('2024-03-12'),
    },
  });

  console.log('Created sample contributions');

  // Create a sample scrape log
  await prisma.scrapeLog.create({
    data: {
      reposScraped: 5,
      issuesFound: 7,
      issuesUpdated: 7,
      status: 'COMPLETED',
      completedAt: new Date(),
    },
  });

  console.log('Created sample scrape log');
  console.log('Seeding complete!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
