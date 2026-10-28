import { describe, it, expect, beforeEach } from 'vitest';
import fc from 'fast-check';
import { Leaderboard } from '../../gamification/Leaderboard';
import { SaveSystem } from '../../storage/SaveSystem';

describe('Leaderboard Property Tests', () => {
  beforeEach(() => {
    localStorage.clear();
    SaveSystem.resetInstance();
    Leaderboard.resetInstance();
  });

  /**
   * Feature: complete-game-expansion, Property 8: Leaderboard Top-10 Ordering and Size
   * Validates: Requirements 14.5
   *
   * For any sequence of score submissions to a single minigame, the resulting leaderboard
   * SHALL contain at most 10 entries, SHALL be sorted in descending order by score,
   * and the entry set SHALL equal the top-10 scores from all submitted entries.
   */
  it('Property 8: Leaderboard maintains at most 10 entries sorted descending with highest scores', () => {
    const entryArbitrary = fc.record({
      playerName: fc.string({ minLength: 1, maxLength: 20 }),
      score: fc.integer({ min: 0, max: 10000 })
    });

    fc.assert(
      fc.property(fc.array(entryArbitrary, { minLength: 0, maxLength: 40 }), (submissions) => {
        localStorage.clear();
        SaveSystem.resetInstance();
        Leaderboard.resetInstance();

        const leaderboard = Leaderboard.getInstance();
        const minigameId = 'test_game';

        for (const sub of submissions) {
          leaderboard.submitScore(minigameId, sub.score, sub.playerName, 'profile_1');
        }

        const top10 = leaderboard.getTop10(minigameId);

        // 1. Size constraint: at most 10 entries
        expect(top10.length).toBeLessThanOrEqual(10);
        expect(top10.length).toBe(Math.min(10, submissions.length));

        // 2. Ordering constraint: sorted in descending order by score
        for (let i = 1; i < top10.length; i++) {
          expect(top10[i - 1].score).toBeGreaterThanOrEqual(top10[i].score);
        }

        // 3. Set correctness: scores in top10 must match top scores from submissions
        if (submissions.length > 0) {
          const expectedTopScores = submissions
            .map((s) => s.score)
            .sort((a, b) => b - a)
            .slice(0, 10);
          const actualScores = top10.map((e) => e.score);

          expect(actualScores).toEqual(expectedTopScores);
        }
      }),
      { numRuns: 100 }
    );
  });
});
