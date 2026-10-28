import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { NarrativeStateData } from '../../world/DialogueSystem';

describe('NarrativeState Serialization Properties', () => {
  /**
   * Feature: complete-game-expansion, Property 10: NarrativeState Serialization Round-Trip
   * Validates: Requirements 2.3
   */
  it('Property 10: JSON serialization and deserialization produces an identical NarrativeState', () => {
    const narrativeStateArbitrary: fc.Arbitrary<NarrativeStateData> = fc.record({
      version: fc.constant(1),
      completedQuestIds: fc.array(fc.string({ minLength: 1 })),
      activeQuestIds: fc.array(fc.string({ minLength: 1 })),
      dialogueChoices: fc.dictionary(fc.string({ minLength: 1 }), fc.string()),
      relationships: fc.dictionary(fc.string({ minLength: 1 }), fc.integer({ min: -100, max: 100 })),
      discoveredSecrets: fc.array(fc.string())
    });

    fc.assert(
      fc.property(narrativeStateArbitrary, (original) => {
        const serialized = JSON.stringify(original);
        const deserialized: NarrativeStateData = JSON.parse(serialized);

        expect(deserialized.version).toBe(original.version);
        expect(deserialized.completedQuestIds).toEqual(original.completedQuestIds);
        expect(deserialized.activeQuestIds).toEqual(original.activeQuestIds);
        expect(deserialized.dialogueChoices).toEqual(original.dialogueChoices);
        expect(deserialized.relationships).toEqual(original.relationships);
        expect(deserialized.discoveredSecrets).toEqual(original.discoveredSecrets);
      }),
      { numRuns: 100 }
    );
  });
});
