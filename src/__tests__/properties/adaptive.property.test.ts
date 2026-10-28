import { describe, it, expect, beforeEach } from 'vitest';
import fc from 'fast-check';
import { AdaptiveDifficulty } from '../../puzzles/AdaptiveDifficulty';
import { SaveSystem } from '../../storage/SaveSystem';

describe('AdaptiveDifficulty Property Tests', () => {
  beforeEach(() => {
    localStorage.clear();
    SaveSystem.resetInstance();
    AdaptiveDifficulty.resetInstance();
  });

  /**
   * Feature: complete-game-expansion, Property 4: AdaptiveDifficulty Success Rate Invariant
   * Validates: Requirements 5.3, 5.4, 5.5
   */
  it('Property 4: getSuccessRate returns trueCount / max(1, length) in [0, 1] for any sequence of boolean interactions', () => {
    fc.assert(
      fc.property(fc.array(fc.boolean(), { minLength: 0, maxLength: 30 }), (interactions) => {
        AdaptiveDifficulty.resetInstance();
        const adaptive = AdaptiveDifficulty.getInstance();
        adaptive.clearInteractions();

        for (const item of interactions) {
          adaptive.recordInteraction(item);
        }

        const effectiveRecords = interactions.slice(-10); // Window is last 10
        const rate = adaptive.getSuccessRate();

        expect(rate).toBeGreaterThanOrEqual(0);
        expect(rate).toBeLessThanOrEqual(1);

        if (effectiveRecords.length === 0) {
          expect(rate).toBe(1.0);
        } else {
          const expectedTrueCount = effectiveRecords.filter(Boolean).length;
          const expectedRate = expectedTrueCount / effectiveRecords.length;
          expect(rate).toBeCloseTo(expectedRate, 5);
        }

        // Test threshold logic
        if (effectiveRecords.length > 0) {
          if (rate < 0.4) {
            expect(adaptive.shouldShowHint()).toBe(true);
            expect(adaptive.getAdjustedTimer(100)).toBe(80);
          } else {
            expect(adaptive.shouldShowHint()).toBe(false);
            expect(adaptive.getAdjustedTimer(100)).toBe(100);
          }

          if (rate > 0.85) {
            expect(adaptive.getXpMultiplier()).toBe(0.7);
            expect(adaptive.shouldSurfaceHarderQuestions()).toBe(true);
          } else {
            expect(adaptive.getXpMultiplier()).toBe(1.0);
            expect(adaptive.shouldSurfaceHarderQuestions()).toBe(false);
          }
        }
      }),
      { numRuns: 100 }
    );
  });
});
