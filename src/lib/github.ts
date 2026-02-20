import { Octokit } from '@octokit/rest';
import { graphql } from '@octokit/graphql';
import { withRetry } from './github-retry';

// Lazy initialization — env vars may not be available at module load time
let _octokit: Octokit | null = null;
let _graphqlWithAuth: typeof graphql | null = null;

export function getOctokit() {
  if (!_octokit) {
    _octokit = new Octokit({
      auth: process.env.GITHUB_PERSONAL_ACCESS_TOKEN,
      request: { timeout: 15000 },
    });
  }
  return _octokit;
}

function getGraphql() {
  if (!_graphqlWithAuth) {
    _graphqlWithAuth = graphql.defaults({
      headers: {
        authorization: `token ${process.env.GITHUB_PERSONAL_ACCESS_TOKEN}`,
      },
    });
  }
  return _graphqlWithAuth;
}

// --- GraphQL Queries ---

export async function searchRepositories(query: string, count = 20) {
  return withRetry(async () => {
    const result = await getGraphql()<{
      search: {
        repositoryCount: number;
        nodes: Array<{
          databaseId: number;
          nameWithOwner: string;
          owner: { login: string };
          name: string;
          description: string | null;
          primaryLanguage: { name: string } | null;
          languages: { nodes: Array<{ name: string }> };
          stargazerCount: number;
          forkCount: number;
          issues: { totalCount: number };
          updatedAt: string;
        }>;
      };
    }>(
      `
      query SearchRepos($searchQuery: String!, $count: Int!) {
        search(query: $searchQuery, type: REPOSITORY, first: $count) {
          repositoryCount
          nodes {
            ... on Repository {
              databaseId
              nameWithOwner
              owner { login }
              name
              description
              primaryLanguage { name }
              languages(first: 10) { nodes { name } }
              stargazerCount
              forkCount
              issues(states: OPEN) { totalCount }
              updatedAt
            }
          }
        }
      }
      `,
      { searchQuery: query, count },
    );

    return result.search.nodes;
  });
}

interface IssueNode {
  databaseId: number;
  number: number;
  title: string;
  body: string | null;
  labels: { nodes: Array<{ name: string }> };
  assignees: { totalCount: number };
  comments: { totalCount: number };
  state: string;
  createdAt: string;
  updatedAt: string;
}

export async function getRepositoryIssues(
  owner: string,
  name: string,
  labels: string[] = ['good first issue', 'help wanted'],
) {
  const allIssues: IssueNode[] = [];
  let cursor: string | null = null;
  const PER_PAGE = 100; // GitHub GraphQL max per page

  // Paginate through ALL open labeled issues
  do {
    const page = await withRetry(async () => {
      const result = await getGraphql()<{
        repository: {
          issues: {
            nodes: IssueNode[];
            pageInfo: { hasNextPage: boolean; endCursor: string | null };
          };
        };
      }>(
        `
        query GetIssues($owner: String!, $name: String!, $labels: [String!], $perPage: Int!, $cursor: String) {
          repository(owner: $owner, name: $name) {
            issues(
              first: $perPage,
              after: $cursor,
              states: OPEN,
              labels: $labels,
              orderBy: { field: UPDATED_AT, direction: DESC }
            ) {
              nodes {
                databaseId
                number
                title
                body
                labels(first: 10) { nodes { name } }
                assignees(first: 1) { totalCount }
                comments { totalCount }
                state
                createdAt
                updatedAt
              }
              pageInfo {
                hasNextPage
                endCursor
              }
            }
          }
        }
        `,
        { owner, name, labels, perPage: PER_PAGE, cursor },
      );

      return result.repository.issues;
    });

    allIssues.push(...page.nodes);

    if (page.pageInfo.hasNextPage && page.pageInfo.endCursor) {
      cursor = page.pageInfo.endCursor;
    } else {
      break;
    }
  } while (true);

  return allIssues;
}

export async function getRepository(owner: string, name: string) {
  return withRetry(async () => {
    const result = await getGraphql()<{
      repository: {
        databaseId: number;
        nameWithOwner: string;
        owner: { login: string };
        name: string;
        description: string | null;
        primaryLanguage: { name: string } | null;
        languages: { nodes: Array<{ name: string }> };
        stargazerCount: number;
        forkCount: number;
        issues: { totalCount: number };
        updatedAt: string;
      };
    }>(
      `
      query GetRepo($owner: String!, $name: String!) {
        repository(owner: $owner, name: $name) {
          databaseId
          nameWithOwner
          owner { login }
          name
          description
          primaryLanguage { name }
          languages(first: 10) { nodes { name } }
          stargazerCount
          forkCount
          issues(states: OPEN) { totalCount }
          updatedAt
        }
      }
      `,
      { owner, name },
    );

    return result.repository;
  });
}

export async function getPullRequestStatus(owner: string, repo: string, prNumber: number) {
  return withRetry(async () => {
    const { data } = await getOctokit().pulls.get({
      owner,
      repo,
      pull_number: prNumber,
    });

    return {
      state: data.state,
      merged: data.merged,
      mergedAt: data.merged_at,
      closedAt: data.closed_at,
    };
  });
}
