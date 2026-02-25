import prisma from '@/lib/db';
import { searchRepositories, getRepositoryIssues } from '@/lib/github';
import {
  calculateRepoHealthScore,
  classifyIssueDifficulty,
  calculateMergeProbability,
} from './scoring';
import { invalidateCache } from '@/lib/redis';
import { logger } from '@/lib/logger';
import type { SyncResult } from '@/types';

function getRecentDate(): string {
  const d = new Date();
  d.setMonth(d.getMonth() - 3);
  return d.toISOString().split('T')[0];
}

// Top tech company GitHub organizations — auto-discover their OSS repos
const INDUSTRY_ORGS = [
  // Big Tech
  'facebook', 'google', 'microsoft', 'apple', 'amazon',
  // Cloud & Infra
  'vercel', 'supabase', 'netlify', 'cloudflare', 'hashicorp', 'docker',
  // Developer Tools
  'github', 'prisma', 'grafana', 'elastic',
  // AI & ML
  'openai', 'huggingface', 'langchain-ai',
  // Web Frameworks
  'vuejs', 'angular', 'sveltejs', 'remix-run', 'nuxt',
  // Backend & Runtime
  'nodejs', 'denoland', 'django', 'laravel',
  // Infra & DevOps
  'kubernetes', 'apache', 'cncf',
  // Startups & Tools
  'stripe', 'shopify', 'directus', 'nocodb', 'appwrite',
  // Databases
  'mongodb', 'cockroachdb',
];

// High-value development topics
const DISCOVERY_TOPICS = [
  'machine-learning', 'web-framework', 'cli', 'devtools',
  'api', 'database', 'testing', 'security',
  'cloud-native', 'blockchain', 'game-development', 'mobile',
  'data-science', 'compiler', 'networking', 'embedded',
];

// Every major programming language on GitHub — grouped by ecosystem
// Tier 1: Mainstream (high volume, use higher star threshold to avoid noise)
const TIER1_LANGUAGES = [
  'JavaScript', 'TypeScript', 'Python', 'Java', 'C#',
  'PHP', 'C++', 'C', 'Go', 'Ruby',
];

// Tier 2: Growing & popular (moderate volume)
const TIER2_LANGUAGES = [
  'Rust', 'Swift', 'Kotlin', 'Dart', 'Scala',
  'R', 'Shell', 'Lua', 'Perl', 'Haskell',
  'Elixir', 'Clojure', 'Julia', 'Zig', 'Objective-C',
];

// Tier 3: Niche & emerging (lower volume, use lower threshold to find gems)
const TIER3_LANGUAGES = [
  'Erlang', 'OCaml', 'F#', 'Nim', 'Crystal',
  'V', 'Gleam', 'Racket', 'Common Lisp', 'Scheme',
  'Fortran', 'Ada', 'COBOL', 'D', 'Assembly',
  'Groovy', 'PowerShell', 'MATLAB', 'Solidity', 'Move',
  'Svelte', 'Vue', 'VHDL', 'Verilog', 'SystemVerilog',
  'Tcl', 'Prolog', 'Elm', 'PureScript', 'ReasonML',
  'Nix', 'Dhall', 'Terraform', 'HCL', 'CUDA',
  'Cython', 'Mojo', 'Carbon', 'Odin', 'Roc',
];

function buildSearchQueries(): string[] {
  const since = getRecentDate();
  const queries: string[] = [];

  // Phase A: Industry org discovery — repos from top companies with contributor-ready issues
  for (const org of INDUSTRY_ORGS) {
    queries.push(`org:${org} good-first-issues:>0 pushed:>${since}`);
  }

  // Phase B: Topic-based discovery — trending in each domain
  for (const topic of DISCOVERY_TOPICS) {
    queries.push(`topic:${topic} stars:>200 good-first-issues:>3 pushed:>${since}`);
  }

  // Phase C: Language-specific discovery — tiered star thresholds
  // Tier 1 (mainstream): higher bar since Phases A/B already catch many of these
  for (const lang of TIER1_LANGUAGES) {
    queries.push(`stars:>500 good-first-issues:>3 language:${lang} pushed:>${since}`);
  }

  // Tier 2 (growing): moderate bar to find quality repos in popular-but-not-dominant languages
  for (const lang of TIER2_LANGUAGES) {
    queries.push(`stars:>100 good-first-issues:>1 language:${lang} pushed:>${since}`);
  }

  // Tier 3 (niche/emerging): low bar — these languages have fewer repos, every gem counts
  for (const lang of TIER3_LANGUAGES) {
    queries.push(`stars:>20 good-first-issues:>0 language:${lang} pushed:>${since}`);
  }

  // Phase D: General high-quality catches (language-agnostic)
  queries.push(
    `stars:>1000 good-first-issues:>5 pushed:>${since}`,
    `stars:>500 topic:hacktoberfest pushed:>${since}`,
    `stars:>50 label:"help wanted" label:"good first issue" pushed:>${since}`,
    `stars:10..500 good-first-issues:>3 pushed:>${since}`,
    // Catch repos with "contributions welcome" or "beginner friendly" labels
    `stars:>50 label:"contributions welcome" pushed:>${since}`,
    `stars:>50 label:"beginner friendly" pushed:>${since}`,
  );

  return queries;
}

export async function syncRepositories(query: string, count = 20): Promise<SyncResult> {
  const result: SyncResult = { reposProcessed: 0, issuesFound: 0, issuesUpdated: 0, errors: [] };

  try {
    const repos = await searchRepositories(query, count);

    for (const repo of repos) {
      try {
        const healthScore = calculateRepoHealthScore({
          stars: repo.stargazerCount,
          forks: repo.forkCount,
          openIssuesCount: repo.issues.totalCount,
          updatedAt: repo.updatedAt,
        });

        await prisma.repository.upsert({
          where: { githubId: repo.databaseId },
          update: {
            fullName: repo.nameWithOwner,
            description: repo.description,
            language: repo.primaryLanguage?.name || null,
            languages: repo.languages.nodes.map((l) => l.name),
            stars: repo.stargazerCount,
            forks: repo.forkCount,
            openIssuesCount: repo.issues.totalCount,
            healthScore,
            lastScrapedAt: new Date(),
          },
          create: {
            githubId: repo.databaseId,
            fullName: repo.nameWithOwner,
            owner: repo.owner.login,
            name: repo.name,
            description: repo.description,
            language: repo.primaryLanguage?.name || null,
            languages: repo.languages.nodes.map((l) => l.name),
            stars: repo.stargazerCount,
            forks: repo.forkCount,
            openIssuesCount: repo.issues.totalCount,
            healthScore,
            lastScrapedAt: new Date(),
          },
        });

        result.reposProcessed++;
      } catch (err) {
        const message = `Failed to sync repo ${repo.nameWithOwner}: ${err}`;
        logger.error(message);
        result.errors.push(message);
      }
    }
  } catch (err) {
    const message = `Failed to search repositories: ${err}`;
    logger.error(message);
    result.errors.push(message);
  }

  return result;
}

export async function syncIssuesForRepo(
  repoId: string,
  owner: string,
  name: string,
  repoHealthScore: number,
): Promise<SyncResult> {
  const result: SyncResult = { reposProcessed: 1, issuesFound: 0, issuesUpdated: 0, errors: [] };

  try {
    const issues = await getRepositoryIssues(owner, name);

    for (const issue of issues) {
      try {
        const labels = issue.labels.nodes.map((l) => l.name);
        const difficulty = classifyIssueDifficulty({
          labels,
          body: issue.body,
          commentCount: issue.comments.totalCount,
        });

        const daysSinceCreated =
          (Date.now() - new Date(issue.createdAt).getTime()) / (1000 * 60 * 60 * 24);

        const mergeProbability = calculateMergeProbability({
          isAssigned: issue.assignees.totalCount > 0,
          commentCount: issue.comments.totalCount,
          labels,
          repoHealthScore,
          daysSinceCreated,
        });

        await prisma.issue.upsert({
          where: { githubId: issue.databaseId },
          update: {
            title: issue.title,
            body: issue.body,
            labels,
            difficulty,
            mergeProbability,
            isAssigned: issue.assignees.totalCount > 0,
            isOpen: issue.state === 'OPEN',
            commentCount: issue.comments.totalCount,
            updatedAtGithub: new Date(issue.updatedAt),
          },
          create: {
            githubId: issue.databaseId,
            repoId,
            number: issue.number,
            title: issue.title,
            body: issue.body,
            labels,
            difficulty,
            mergeProbability,
            isAssigned: issue.assignees.totalCount > 0,
            isOpen: issue.state === 'OPEN',
            commentCount: issue.comments.totalCount,
            createdAtGithub: new Date(issue.createdAt),
            updatedAtGithub: new Date(issue.updatedAt),
          },
        });

        result.issuesUpdated++;
      } catch (err) {
        const message = `Failed to sync issue #${issue.number}: ${err}`;
        logger.error(message);
        result.errors.push(message);
      }
    }

    result.issuesFound = issues.length;

    // Mark issues no longer returned by GitHub (closed/removed) as not open.
    // getRepositoryIssues now paginates through ALL open issues, so this is safe.
    const fetchedGithubIds = issues.map((i) => i.databaseId);

    if (fetchedGithubIds.length > 0) {
      const closed = await prisma.issue.updateMany({
        where: {
          repoId,
          isOpen: true,
          githubId: { notIn: fetchedGithubIds },
        },
        data: { isOpen: false },
      });
      if (closed.count > 0) {
        logger.info({ repo: `${owner}/${name}`, count: closed.count }, 'Marked missing issues as closed');
      }
    } else {
      // GitHub returned zero open issues — close all issues for this repo
      const closed = await prisma.issue.updateMany({
        where: { repoId, isOpen: true },
        data: { isOpen: false },
      });
      if (closed.count > 0) {
        logger.info({ repo: `${owner}/${name}`, count: closed.count }, 'Marked all issues as closed (none open on GitHub)');
      }
    }
  } catch (err) {
    const message = `Failed to fetch issues for ${owner}/${name}: ${err}`;
    logger.error(message);
    result.errors.push(message);
  }

  return result;
}

export async function fullSync(): Promise<SyncResult> {
  const totalResult: SyncResult = {
    reposProcessed: 0,
    issuesFound: 0,
    issuesUpdated: 0,
    errors: [],
  };

  // Phase 1: Discover and sync repositories from all sources
  const queries = buildSearchQueries();
  logger.info(`Starting full sync with ${queries.length} discovery queries`);

  for (const query of queries) {
    try {
      const repoResult = await syncRepositories(query, 20);
      totalResult.reposProcessed += repoResult.reposProcessed;
      totalResult.errors.push(...repoResult.errors);
    } catch (err) {
      // Log but don't stop — one failed query shouldn't kill the whole sync
      logger.error(`Query failed: ${query} — ${err}`);
    }

    // GitHub API: 30 search requests/min — 2s gap keeps us under limit
    await new Promise((r) => setTimeout(r, 2000));
  }

  logger.info(`Phase 1 complete: ${totalResult.reposProcessed} repos discovered`);

  // Phase 2: Sync issues for all active repositories
  const activeRepos = await prisma.repository.findMany({
    where: { isActive: true },
    select: { id: true, owner: true, name: true, healthScore: true },
  });

  logger.info(`Phase 2: Syncing issues for ${activeRepos.length} active repos`);

  for (const repo of activeRepos) {
    try {
      const issueResult = await syncIssuesForRepo(repo.id, repo.owner, repo.name, repo.healthScore);
      totalResult.issuesFound += issueResult.issuesFound;
      totalResult.issuesUpdated += issueResult.issuesUpdated;
      totalResult.errors.push(...issueResult.errors);
    } catch (err) {
      logger.error(`Issue sync failed for ${repo.owner}/${repo.name}: ${err}`);
    }

    // GraphQL rate limit: 5000 points/hour — 1s gap is sufficient
    await new Promise((r) => setTimeout(r, 1000));
  }

  // Phase 3: Invalidate all cached API responses so explore/dashboard serve fresh data
  await invalidateCache('issues', 'recommendations', 'repos', 'stats');
  logger.info('Cleared all cached API responses after sync');

  logger.info(
    `Full sync complete: ${totalResult.reposProcessed} repos, ${totalResult.issuesFound} issues found, ${totalResult.issuesUpdated} updated`,
  );

  return totalResult;
}
