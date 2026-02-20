import { describe, it, expect, vi, afterEach } from 'vitest';
import { calculateDCS } from '../dcs-scoring';
import type { ContributionInput } from '../dcs-scoring';

// --- Helpers ---

function makeContribution(overrides: Partial<ContributionInput> = {}): ContributionInput {
  return {
    status: 'PR_MERGED',
    difficulty: 'EASY',
    repoStars: 1000,
    startedAt: new Date(),
    mergedAt: new Date(),
    ...overrides,
  };
}

function weeksAgo(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - n * 7);
  return d;
}

// --- Tests ---

describe('calculateDCS', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  // === Edge Cases ===

  describe('edge cases', () => {
    it('returns 0 score and Newcomer for empty contributions', () => {
      const result = calculateDCS([]);
      expect(result.score).toBe(0);
      expect(result.level).toBe('Newcomer');
      expect(result.totalFinished).toBe(0);
      expect(result.totalMerged).toBe(0);
      expect(result.breakdown.mergeRate).toBe(0);
      expect(result.breakdown.difficultyGrowth).toBe(0);
      expect(result.breakdown.repoCaliber).toBe(0);
      expect(result.breakdown.consistency).toBe(0);
    });

    it('returns 0 merge rate for only in-progress contributions', () => {
      const result = calculateDCS([
        makeContribution({ status: 'STARTED', mergedAt: null }),
        makeContribution({ status: 'PR_OPENED', mergedAt: null }),
      ]);
      // Only consistency should be non-zero (recent activity)
      expect(result.breakdown.mergeRate).toBe(0);
      expect(result.breakdown.difficultyGrowth).toBe(0);
      expect(result.breakdown.repoCaliber).toBe(0);
      expect(result.totalFinished).toBe(0);
    });

    it('handles a single merged contribution', () => {
      const result = calculateDCS([makeContribution()]);
      expect(result.score).toBeGreaterThan(0);
      expect(result.totalMerged).toBe(1);
      expect(result.totalFinished).toBe(1);
      // Volume bonus: 1/10 = 0.1, so mergeRate = 1.0 * 0.1 * 1000 = 100
      expect(result.breakdown.mergeRate).toBe(100);
    });

    it('score never exceeds 1000', () => {
      // Max out everything: many Hard issues in 100K+ repos, all merged, consistent
      const contribs = Array.from({ length: 20 }, (_, i) =>
        makeContribution({
          difficulty: 'HARD',
          repoStars: 200000,
          startedAt: weeksAgo(i % 12),
          mergedAt: weeksAgo(i % 12),
        }),
      );
      const result = calculateDCS(contribs);
      expect(result.score).toBeLessThanOrEqual(1000);
    });

    it('score never goes below 0', () => {
      // All abandoned, bad repos
      const contribs = Array.from({ length: 5 }, () =>
        makeContribution({ status: 'ABANDONED', repoStars: 1, mergedAt: null }),
      );
      const result = calculateDCS(contribs);
      expect(result.score).toBeGreaterThanOrEqual(0);
    });
  });

  // === Merge Rate ===

  describe('merge rate scoring', () => {
    it('rewards higher merge rates', () => {
      const high = calculateDCS([
        ...Array.from({ length: 9 }, () => makeContribution()),
        makeContribution({ status: 'PR_CLOSED', mergedAt: null }),
      ]);
      const low = calculateDCS([
        ...Array.from({ length: 3 }, () => makeContribution()),
        ...Array.from({ length: 7 }, () =>
          makeContribution({ status: 'ABANDONED', mergedAt: null }),
        ),
      ]);
      expect(high.breakdown.mergeRate).toBeGreaterThan(low.breakdown.mergeRate);
    });

    it('applies volume bonus — 1/1 scores lower than 10/10', () => {
      const oneOfOne = calculateDCS([makeContribution()]);
      const tenOfTen = calculateDCS(Array.from({ length: 10 }, () => makeContribution()));
      // Both have 100% rate but 10/10 has full volume bonus
      expect(tenOfTen.breakdown.mergeRate).toBeGreaterThan(oneOfOne.breakdown.mergeRate);
      expect(oneOfOne.breakdown.mergeRate).toBe(100); // 1.0 * (1/10) * 1000
      expect(tenOfTen.breakdown.mergeRate).toBe(1000); // 1.0 * 1.0 * 1000
    });

    it('volume bonus caps at 10 contributions', () => {
      const ten = calculateDCS(Array.from({ length: 10 }, () => makeContribution()));
      const twenty = calculateDCS(Array.from({ length: 20 }, () => makeContribution()));
      // Both have 100% rate and full volume bonus
      expect(ten.breakdown.mergeRate).toBe(twenty.breakdown.mergeRate);
    });

    it('counts PR_CLOSED and ABANDONED as finished but not merged', () => {
      const result = calculateDCS([
        makeContribution(),
        makeContribution({ status: 'PR_CLOSED', mergedAt: null }),
        makeContribution({ status: 'ABANDONED', mergedAt: null }),
      ]);
      expect(result.totalFinished).toBe(3);
      expect(result.totalMerged).toBe(1);
    });

    it('ignores STARTED and PR_OPENED in finished count', () => {
      const result = calculateDCS([
        makeContribution(),
        makeContribution({ status: 'STARTED', mergedAt: null }),
        makeContribution({ status: 'PR_OPENED', mergedAt: null }),
      ]);
      expect(result.totalFinished).toBe(1);
      expect(result.totalMerged).toBe(1);
    });
  });

  // === Difficulty Growth ===

  describe('difficulty growth scoring', () => {
    it('scores higher for harder issues', () => {
      const easy = calculateDCS(
        Array.from({ length: 10 }, () => makeContribution({ difficulty: 'EASY' })),
      );
      const hard = calculateDCS(
        Array.from({ length: 10 }, () => makeContribution({ difficulty: 'HARD' })),
      );
      expect(hard.breakdown.difficultyGrowth).toBeGreaterThan(easy.breakdown.difficultyGrowth);
    });

    it('rewards growth from Easy to Hard over time', () => {
      // No growth: all medium
      const flat = calculateDCS(
        Array.from({ length: 10 }, (_, i) =>
          makeContribution({
            difficulty: 'MEDIUM',
            mergedAt: weeksAgo(10 - i),
          }),
        ),
      );
      // Growth: started Easy, now Hard
      const growing = calculateDCS([
        ...Array.from({ length: 5 }, (_, i) =>
          makeContribution({
            difficulty: 'EASY',
            mergedAt: weeksAgo(10 - i),
          }),
        ),
        ...Array.from({ length: 5 }, (_, i) =>
          makeContribution({
            difficulty: 'HARD',
            mergedAt: weeksAgo(5 - i),
          }),
        ),
      ]);
      expect(growing.breakdown.difficultyGrowth).toBeGreaterThan(flat.breakdown.difficultyGrowth);
    });

    it('handles single contribution without growth comparison', () => {
      const result = calculateDCS([makeContribution({ difficulty: 'HARD' })]);
      // Single contribution: only difficultyLevel, no growth data
      // HARD weight = 7, difficultyLevel = min(1, 7/5) = 1.0
      expect(result.breakdown.difficultyGrowth).toBe(1000);
    });
  });

  // === Repo Caliber ===

  describe('repo caliber scoring', () => {
    it('scores higher for repos with more stars', () => {
      const small = calculateDCS(
        Array.from({ length: 10 }, () => makeContribution({ repoStars: 100 })),
      );
      const large = calculateDCS(
        Array.from({ length: 10 }, () => makeContribution({ repoStars: 100000 })),
      );
      expect(large.breakdown.repoCaliber).toBeGreaterThan(small.breakdown.repoCaliber);
    });

    it('uses log scale — 10K is not 10x better than 1K', () => {
      const oneK = calculateDCS(
        Array.from({ length: 10 }, () => makeContribution({ repoStars: 1000 })),
      );
      const tenK = calculateDCS(
        Array.from({ length: 10 }, () => makeContribution({ repoStars: 10000 })),
      );
      const hundredK = calculateDCS(
        Array.from({ length: 10 }, () => makeContribution({ repoStars: 100000 })),
      );
      // Differences should be roughly equal (log scale)
      const diff1 = tenK.breakdown.repoCaliber - oneK.breakdown.repoCaliber;
      const diff2 = hundredK.breakdown.repoCaliber - tenK.breakdown.repoCaliber;
      // Within 50% of each other (log scale makes them similar)
      expect(Math.abs(diff1 - diff2)).toBeLessThan(Math.max(diff1, diff2) * 0.5);
    });

    it('handles repo with 0 stars (edge case)', () => {
      const result = calculateDCS(
        Array.from({ length: 10 }, () => makeContribution({ repoStars: 0 })),
      );
      // log10(max(1, 0)) / 5 = log10(1) / 5 = 0
      expect(result.breakdown.repoCaliber).toBe(0);
    });

    it('caps at 1000 for extremely popular repos', () => {
      const result = calculateDCS(
        Array.from({ length: 10 }, () => makeContribution({ repoStars: 1000000 })),
      );
      expect(result.breakdown.repoCaliber).toBe(1000);
    });
  });

  // === Consistency ===

  describe('consistency scoring', () => {
    it('rewards activity across multiple weeks', () => {
      const sporadic = calculateDCS([
        makeContribution({ startedAt: weeksAgo(0) }),
      ]);
      const consistent = calculateDCS(
        Array.from({ length: 12 }, (_, i) =>
          makeContribution({ startedAt: weeksAgo(i) }),
        ),
      );
      expect(consistent.breakdown.consistency).toBeGreaterThan(sporadic.breakdown.consistency);
    });

    it('scores 1000 for activity in all 12 weeks', () => {
      const contribs = Array.from({ length: 12 }, (_, i) =>
        makeContribution({ startedAt: weeksAgo(i) }),
      );
      const result = calculateDCS(contribs);
      expect(result.breakdown.consistency).toBe(1000);
    });

    it('ignores activity older than 12 weeks', () => {
      const result = calculateDCS([
        makeContribution({ startedAt: weeksAgo(15) }),
      ]);
      expect(result.breakdown.consistency).toBe(0);
    });

    it('counts any status as activity (including STARTED)', () => {
      const result = calculateDCS([
        makeContribution({ status: 'STARTED', startedAt: weeksAgo(0), mergedAt: null }),
      ]);
      expect(result.breakdown.consistency).toBeGreaterThan(0);
    });
  });

  // === Levels ===

  describe('level assignment', () => {
    it('assigns Newcomer for score 0-200', () => {
      const result = calculateDCS([]);
      expect(result.level).toBe('Newcomer');
    });

    it('assigns correct level for a moderate contributor', () => {
      // 10 merged Easy issues in 1K-star repos, active 6 of 12 weeks
      const contribs = Array.from({ length: 10 }, (_, i) =>
        makeContribution({ startedAt: weeksAgo(i * 2) }),
      );
      const result = calculateDCS(contribs);
      // Should be somewhere between Contributor and Advanced
      expect(['Contributor', 'Advanced Contributor', 'Explorer']).toContain(result.level);
    });

    it('assigns Elite for maxed-out contributor', () => {
      const contribs = Array.from({ length: 20 }, (_, i) =>
        makeContribution({
          difficulty: 'HARD',
          repoStars: 200000,
          startedAt: weeksAgo(i % 12),
          mergedAt: weeksAgo(i % 12),
        }),
      );
      const result = calculateDCS(contribs);
      expect(result.level).toBe('Elite Contributor');
    });
  });

  // === Weighted Sum ===

  describe('weighted sum calculation', () => {
    it('applies correct weights: 0.30, 0.25, 0.25, 0.20', () => {
      // Create a scenario where we can verify the weights
      // 10 merged Easy issues in 1K repos, all recent
      const contribs = Array.from({ length: 10 }, () => makeContribution());
      const result = calculateDCS(contribs);

      const expected = Math.round(
        result.breakdown.mergeRate * 0.30 +
        result.breakdown.difficultyGrowth * 0.25 +
        result.breakdown.repoCaliber * 0.25 +
        result.breakdown.consistency * 0.20,
      );

      expect(result.score).toBe(expected);
    });
  });

  // === Date handling ===

  describe('date handling', () => {
    it('accepts ISO string dates', () => {
      const result = calculateDCS([
        makeContribution({
          startedAt: new Date().toISOString(),
          mergedAt: new Date().toISOString(),
        }),
      ]);
      expect(result.score).toBeGreaterThan(0);
    });

    it('accepts Date objects', () => {
      const result = calculateDCS([
        makeContribution({
          startedAt: new Date(),
          mergedAt: new Date(),
        }),
      ]);
      expect(result.score).toBeGreaterThan(0);
    });
  });
});
