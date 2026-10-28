import { describe, it, expect, beforeEach } from 'vitest';
import fc from 'fast-check';
import { SaveSystem, SAVE_VERSION, GameSave } from '../../storage/SaveSystem';

// Helper to recursively assert that no object key has undefined value
function assertNoUndefinedFields(obj: any, path = ''): void {
  expect(obj).toBeDefined();
  expect(obj).not.toBeNull();

  for (const [key, val] of Object.entries(obj)) {
    const currentPath = path ? `${path}.${key}` : key;
    expect(val, `Field ${currentPath} should not be undefined`).not.toBeUndefined();
    if (val !== null && typeof val === 'object' && !Array.isArray(val)) {
      assertNoUndefinedFields(val, currentPath);
    }
  }
}

describe('SaveSystem Properties', () => {
  let saveSystem: SaveSystem;

  beforeEach(() => {
    localStorage.clear();
    SaveSystem.resetInstance();
    saveSystem = SaveSystem.getInstance();
  });

  /**
   * Feature: complete-game-expansion, Property 2: SaveSystem Migration Preserves Fields
   * Validates: Requirements 13.2
   */
  it('Property 2: Migrating any v1 or v2 save preserves source fields and has no undefined values', () => {
    const v1Arbitrary = fc.record({
      version: fc.constant(1),
      progression: fc.record({
        level: fc.integer({ min: 1, max: 100 }),
        xp: fc.integer({ min: 0, max: 100000 }),
        coins: fc.integer({ min: 0, max: 50000 }),
        rankTitle: fc.string({ minLength: 1, maxLength: 30 }),
        unlockedItems: fc.array(fc.string()),
        unlockedRelics: fc.array(fc.string()),
        completedQuests: fc.array(fc.string())
      }),
      campaign: fc.record({
        unlocked: fc.array(fc.string()),
        results: fc.dictionary(
          fc.string(),
          fc.record({
            completed: fc.boolean(),
            stars: fc.integer({ min: 0, max: 3 }),
            bestTimeSeconds: fc.option(fc.float({ min: 1, max: 3600 }))
          })
        )
      })
    });

    const v2Arbitrary = fc.record({
      version: fc.constant(2),
      profile: fc.record({
        id: fc.string({ minLength: 1 }),
        displayName: fc.string({ minLength: 1 }),
        createdAt: fc.integer({ min: 1000 }),
        lastPlayedAt: fc.integer({ min: 1000 }),
        playtimeSeconds: fc.integer({ min: 0 })
      }),
      progression: fc.record({
        level: fc.integer({ min: 1, max: 100 }),
        xp: fc.integer({ min: 0, max: 100000 }),
        xpToNextLevel: fc.integer({ min: 10, max: 2000 }),
        coins: fc.integer({ min: 0, max: 50000 }),
        rankTitle: fc.string({ minLength: 1 }),
        unlockedItems: fc.array(fc.string()),
        unlockedRelics: fc.array(fc.string()),
        completedQuests: fc.array(fc.string())
      }),
      campaign: fc.record({
        unlocked: fc.array(fc.string()),
        results: fc.dictionary(fc.string(), fc.record({
          completed: fc.boolean(),
          stars: fc.integer({ min: 0, max: 3 }),
          bestTimeSeconds: fc.option(fc.float({ min: 1, max: 3600 }))
        }))
      }),
      narrative: fc.record({
        completedQuestIds: fc.array(fc.string()),
        activeQuestIds: fc.array(fc.string()),
        dialogueChoices: fc.dictionary(fc.string(), fc.string()),
        relationships: fc.dictionary(fc.string(), fc.integer({ min: -100, max: 100 })),
        discoveredSecrets: fc.array(fc.string())
      }),
      achievements: fc.array(fc.string())
    });

    // Test v1 migration
    fc.assert(
      fc.property(v1Arbitrary, (v1Data) => {
        const migrated: GameSave = saveSystem.migrate(v1Data, 1);
        expect(migrated.version).toBe(SAVE_VERSION);
        expect(migrated.progression.level).toBe(v1Data.progression.level);
        expect(migrated.progression.xp).toBe(v1Data.progression.xp);
        expect(migrated.progression.coins).toBe(v1Data.progression.coins);
        expect(migrated.progression.rankTitle).toBe(v1Data.progression.rankTitle);
        assertNoUndefinedFields(migrated);
      }),
      { numRuns: 100 }
    );

    // Test v2 migration
    fc.assert(
      fc.property(v2Arbitrary, (v2Data) => {
        const migrated: GameSave = saveSystem.migrate(v2Data, 2);
        expect(migrated.version).toBe(SAVE_VERSION);
        expect(migrated.profile.displayName).toBe(v2Data.profile.displayName);
        expect(migrated.narrative.completedQuestIds).toEqual(v2Data.narrative.completedQuestIds);
        expect(migrated.achievements).toEqual(v2Data.achievements);
        assertNoUndefinedFields(migrated);
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Feature: complete-game-expansion, Property 3: SaveSystem Resilience to Corrupt Input
   * Validates: Requirements 13.3
   */
  it('Property 3: Any string in localStorage returns valid default GameSave without throwing', () => {
    fc.assert(
      fc.property(fc.string(), (corruptContent) => {
        const profileId = 'test_corrupt_profile';
        localStorage.setItem(saveSystem.storageKey(profileId), corruptContent);

        let result: GameSave | null = null;
        expect(() => {
          result = saveSystem.load(profileId);
        }).not.toThrow();

        expect(result).not.toBeNull();
        expect(result!.version).toBe(SAVE_VERSION);
        expect(result!.progression).toBeDefined();
        assertNoUndefinedFields(result!);
      }),
      { numRuns: 100 }
    );
  });
});
