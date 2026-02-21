import type { Difficulty } from '@/types';

interface RepoScoreInput {
  stars: number;
  forks: number;
  openIssuesCount: number;
  updatedAt?: Date | string | null;
}

/**
 * Calculates a health score (0-100) for a repository based on activity signals.
 */
export function calculateRepoHealthScore(repo: RepoScoreInput): number {
  let score = 0;

  // Star score (0-25): logarithmic scale, 1000+ stars = max
  const starScore = Math.min(25, (Math.log10(Math.max(1, repo.stars)) / 5) * 25);
  score += starScore;

  // Fork score (0-15): indicates community engagement
  const forkScore = Math.min(15, (Math.log10(Math.max(1, repo.forks)) / 4) * 15);
  score += forkScore;

  // Issue ratio score (0-20): healthy repos have manageable open issue counts
  const issueRatio = repo.openIssuesCount / Math.max(1, repo.stars);
  const issueScore = issueRatio < 0.01 ? 20 : issueRatio < 0.05 ? 15 : issueRatio < 0.1 ? 10 : 5;
  score += issueScore;

  // Activity score (0-25): how recently the repo was updated
  if (repo.updatedAt) {
    const updatedDate =
      typeof repo.updatedAt === 'string' ? new Date(repo.updatedAt) : repo.updatedAt;
    const daysSinceUpdate = (Date.now() - updatedDate.getTime()) / (1000 * 60 * 60 * 24);
    const activityScore =
      daysSinceUpdate < 7 ? 25 : daysSinceUpdate < 30 ? 20 : daysSinceUpdate < 90 ? 12 : 5;
    score += activityScore;
  }

  // Base community score (0-15): repos with both stars and forks show healthy community
  const communityRatio = repo.forks / Math.max(1, repo.stars);
  const communityScore = communityRatio > 0.1 ? 15 : communityRatio > 0.05 ? 10 : 5;
  score += communityScore;

  return Math.round(Math.min(100, Math.max(0, score)));
}

interface IssueDifficultyInput {
  labels: string[];
  body: string | null;
  commentCount: number;
}

/**
 * Classifies issue difficulty based on labels, body length, and comment count.
 */
export function classifyIssueDifficulty(issue: IssueDifficultyInput): Difficulty {
  const labelsLower = issue.labels.map((l) => l.toLowerCase());

  // Label-based classification
  const easyLabels = ['good first issue', 'beginner', 'easy', 'starter', 'first-timers-only'];
  const hardLabels = ['complex', 'advanced', 'hard', 'architecture', 'breaking-change', 'rfc'];

  const hasEasyLabel = labelsLower.some((l) => easyLabels.some((el) => l.includes(el)));
  const hasHardLabel = labelsLower.some((l) => hardLabels.some((hl) => l.includes(hl)));

  if (hasEasyLabel && !hasHardLabel) return 'EASY';
  if (hasHardLabel) return 'HARD';

  // Heuristic-based classification
  const bodyLength = issue.body?.length || 0;
  const commentScore = issue.commentCount;

  // Long descriptions with many comments suggest complexity
  if (bodyLength > 2000 || commentScore > 10) return 'HARD';
  if (bodyLength > 500 || commentScore > 3) return 'MEDIUM';

  return 'EASY';
}

interface MergeProbabilityInput {
  isAssigned: boolean;
  commentCount: number;
  labels: string[];
  repoHealthScore: number;
  daysSinceCreated: number;
}

/**
 * Estimates the probability (0.0-1.0) that a PR for this issue will be merged.
 */
export function calculateMergeProbability(input: MergeProbabilityInput): number {
  let probability = 0.5; // Base probability

  // Repo health factor (+/- 0.15)
  probability += (input.repoHealthScore / 100 - 0.5) * 0.3;

  // Not assigned = higher chance for new contributors (+0.1)
  if (!input.isAssigned) probability += 0.1;

  // Labels with "good first issue" or "help wanted" = maintainer wants help (+0.15)
  const labelsLower = input.labels.map((l) => l.toLowerCase());
  if (labelsLower.some((l) => l.includes('good first issue'))) probability += 0.15;
  if (labelsLower.some((l) => l.includes('help wanted'))) probability += 0.1;

  // Fresh issues are more likely to accept PRs
  if (input.daysSinceCreated < 30) probability += 0.1;
  else if (input.daysSinceCreated > 180) probability -= 0.15;

  // Moderate comments = active discussion = maintainer cares
  if (input.commentCount >= 1 && input.commentCount <= 5) probability += 0.05;
  else if (input.commentCount > 20) probability -= 0.1;

  return Math.min(1, Math.max(0, Math.round(probability * 100) / 100));
}
