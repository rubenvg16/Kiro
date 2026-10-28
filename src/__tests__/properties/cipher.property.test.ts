import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { caesarCipher } from '../../puzzles/caesarCipher';

describe('Caesar Cipher Property Tests', () => {
  /**
   * Feature: complete-game-expansion, Property 1: Caesar Cipher Round-Trip
   * Validates: Requirements 4.9
   *
   * For any string of alphabetic characters and any integer shift value in [1, 26],
   * encoding the string with caesar(text, shift) and then decoding it with caesar(encoded, -shift)
   * SHALL produce a string equal to the original.
   */
  it('Property 1: Caesar cipher encode followed by decode with -shift returns original string', () => {
    // Generate strings of alphabetic characters (both uppercase and lowercase)
    const alphabeticStringArbitrary = fc.stringMatching(/^[a-zA-Z]+$/);
    const shiftArbitrary = fc.integer({ min: 1, max: 26 });

    fc.assert(
      fc.property(alphabeticStringArbitrary, shiftArbitrary, (text, shift) => {
        const encoded = caesarCipher(text, shift);
        const decoded = caesarCipher(encoded, -shift);
        expect(decoded).toBe(text);
      }),
      { numRuns: 100 }
    );
  });

  it('Property 1 (Extended): Round-trip holds for arbitrary strings including spaces and punctuation with any integer shift', () => {
    fc.assert(
      fc.property(fc.string(), fc.integer({ min: -1000, max: 1000 }), (text, shift) => {
        const encoded = caesarCipher(text, shift);
        const decoded = caesarCipher(encoded, -shift);
        expect(decoded).toBe(text);
      }),
      { numRuns: 100 }
    );
  });
});
