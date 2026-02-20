import { describe, it, expect } from 'vitest';
import {
  calculateRepoHealthScore,
  classifyIssueDifficulty,
  calculateMergeProbability,
} from '../scoring';

describe('calculateRepoHealthScore', () => {
  it('returns a low score for repos with no activity', () => {
    const score = calculateRepoHealthScore({
      stars: 0,
      forks: 0,
      openIssuesCount: 0,
    });
    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(100);
  });

  it('returns a high score for popular, active repos', () => {
    const score = calculateRepoHealthScore({
      stars: 10000,
      forks: 2000,
      openIssuesCount: 50,
      updatedAt: new Date().toISOString(),
    });
    expect(score).toBeGreaterThan(70);
    expect(score).toBeLessThanOrEqual(100);
  });

  it('handles updatedAt as a Date object', () => {
    const score = calculateRepoHealthScore({
      stars: 500,
      forks: 50,
      openIssuesCount: 10,
      updatedAt: new Date(),
    });
    expect(score).toBeGreaterThan(0);
  });

  it('gives lower activity score for stale repos', () => {
    const recentScore = calculateRepoHealthScore({
      stars: 1000,
      forks: 100,
      openIssuesCount: 10,
      updatedAt: new Date().toISOString(),
    });
    const staleDate = new Date();
    staleDate.setFullYear(staleDate.getFullYear() - 1);
    const staleScore = calculateRepoHealthScore({
      stars: 1000,
      forks: 100,
      openIssuesCount: 10,
      updatedAt: staleDate.toISOString(),
    });
    expect(recentScore).toBeGreaterThan(staleScore);
  });

  it('penalizes high issue-to-star ratios', () => {
    const healthyScore = calculateRepoHealthScore({
      stars: 1000,
      forks: 100,
      openIssuesCount: 5,
    });
    const bloatedScore = calculateRepoHealthScore({
      stars: 1000,
      forks: 100,
      openIssuesCount: 500,
    });
    expect(healthyScore).toBeGreaterThan(bloatedScore);
  });

  it('always returns a value between 0 and 100', () => {
    const extremeCases = [
      { stars: 0, forks: 0, openIssuesCount: 0 },
      { stars: 999999, forks: 999999, openIssuesCount: 0, updatedAt: new Date().toISOString() },
      { stars: 1, forks: 0, openIssuesCount: 99999 },
    ];
    for (const input of extremeCases) {
      const score = calculateRepoHealthScore(input);
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(100);
    }
  });
});

describe('classifyIssueDifficulty', () => {
  it('returns EASY for "good first issue" label', () => {
    expect(
      classifyIssueDifficulty({ labels: ['good first issue'], body: null, commentCount: 0 }),
    ).toBe('EASY');
  });

  it('returns EASY for "beginner" label', () => {
    expect(
      classifyIssueDifficulty({ labels: ['beginner-friendly'], body: null, commentCount: 0 }),
    ).toBe('EASY');
  });

  it('returns HARD for "complex" label', () => {
    expect(
      classifyIssueDifficulty({ labels: ['complex'], body: null, commentCount: 0 }),
    ).toBe('HARD');
  });

  it('returns HARD when both easy and hard labels exist', () => {
    expect(
      classifyIssueDifficulty({
        labels: ['good first issue', 'complex'],
        body: null,
        commentCount: 0,
      }),
    ).toBe('HARD');
  });

  it('returns HARD for long body text', () => {
    expect(
      classifyIssueDifficulty({ labels: [], body: 'a'.repeat(2500), commentCount: 0 }),
    ).toBe('HARD');
  });

  it('returns HARD for many comments', () => {
    expect(
      classifyIssueDifficulty({ labels: [], body: '', commentCount: 15 }),
    ).toBe('HARD');
  });

  it('returns MEDIUM for moderate body length', () => {
    expect(
      classifyIssueDifficulty({ labels: [], body: 'a'.repeat(800), commentCount: 0 }),
    ).toBe('MEDIUM');
  });

  it('returns MEDIUM for moderate comments', () => {
    expect(
      classifyIssueDifficulty({ labels: [], body: '', commentCount: 5 }),
    ).toBe('MEDIUM');
  });

  it('returns EASY for short body and few comments', () => {
    expect(
      classifyIssueDifficulty({ labels: [], body: 'Fix typo', commentCount: 0 }),
    ).toBe('EASY');
  });

  it('returns EASY for null body and zero comments', () => {
    expect(
      classifyIssueDifficulty({ labels: [], body: null, commentCount: 0 }),
    ).toBe('EASY');
  });
});

describe('calculateMergeProbability', () => {
  const baseInput = {
    isAssigned: false,
    commentCount: 0,
    labels: [],
    repoHealthScore: 50,
    daysSinceCreated: 15,
  };

  it('returns ~0.5 for neutral inputs', () => {
    const prob = calculateMergeProbability(baseInput);
    expect(prob).toBeGreaterThanOrEqual(0.4);
    expect(prob).toBeLessThanOrEqual(0.8);
  });

  it('returns higher probability for healthy repos with good labels', () => {
    const prob = calculateMergeProbability({
      ...baseInput,
      repoHealthScore: 90,
      labels: ['good first issue', 'help wanted'],
    });
    expect(prob).toBeGreaterThan(0.7);
  });

  it('returns lower probability for old, assigned issues in unhealthy repos', () => {
    const prob = calculateMergeProbability({
      isAssigned: true,
      commentCount: 25,
      labels: [],
      repoHealthScore: 20,
      daysSinceCreated: 365,
    });
    expect(prob).toBeLessThan(0.5);
  });

  it('always returns between 0 and 1', () => {
    const extremeCases = [
      { ...baseInput, repoHealthScore: 0, daysSinceCreated: 9999, commentCount: 999 },
      {
        ...baseInput,
        repoHealthScore: 100,
        labels: ['good first issue', 'help wanted'],
        daysSinceCreated: 1,
      },
    ];
    for (const input of extremeCases) {
      const prob = calculateMergeProbability(input);
      expect(prob).toBeGreaterThanOrEqual(0);
      expect(prob).toBeLessThanOrEqual(1);
    }
  });

  it('boosts probability for fresh issues', () => {
    const fresh = calculateMergeProbability({ ...baseInput, daysSinceCreated: 5 });
    const stale = calculateMergeProbability({ ...baseInput, daysSinceCreated: 200 });
    expect(fresh).toBeGreaterThan(stale);
  });

  it('boosts probability for unassigned issues', () => {
    const unassigned = calculateMergeProbability({ ...baseInput, isAssigned: false });
    const assigned = calculateMergeProbability({ ...baseInput, isAssigned: true });
    expect(unassigned).toBeGreaterThan(assigned);
  });
});
