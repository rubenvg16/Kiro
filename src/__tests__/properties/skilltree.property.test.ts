import { describe, it, expect, beforeEach } from 'vitest';
import fc from 'fast-check';
import { SkillTree } from '../../gamification/SkillTree';
import { SKILL_DEFINITIONS } from '../../gamification/SkillDefinitions';
import { ProgressionManager } from '../../gamification/ProgressionManager';
import { SaveSystem } from '../../storage/SaveSystem';

describe('SkillTree Property Tests', () => {
  beforeEach(() => {
    localStorage.clear();
    SaveSystem.resetInstance();
    ProgressionManager.resetInstance();
    SkillTree.resetInstance();
  });

  /**
   * Feature: complete-game-expansion, Property 6: SkillTree Prerequisite Invariant
   * Validates: Requirements 9.4
   *
   * For any sequence of SkillTree.purchase() calls, the resulting set of unlocked skills
   * SHALL satisfy: for every skill at depth N >= 2, there exists at least one unlocked skill
   * at depth N - 1 in the same branch.
   */
  it('Property 6: SkillTree prerequisite DAG invariant holds across arbitrary purchase attempts', () => {
    const allSkillIds = SKILL_DEFINITIONS.map((s) => s.id);

    fc.assert(
      fc.property(
        fc.array(fc.constantFrom(...allSkillIds), { minLength: 1, maxLength: 50 }),
        fc.integer({ min: 0, max: 20 }),
        (purchaseAttempts, initialSkillPoints) => {
          localStorage.clear();
          SaveSystem.resetInstance();
          ProgressionManager.resetInstance();
          SkillTree.resetInstance();

          const progression = ProgressionManager.getInstance();
          progression.addSkillPoints(initialSkillPoints);
          const skillTree = SkillTree.getInstance();

          // Try each purchase in order
          for (const skillId of purchaseAttempts) {
            skillTree.purchase(skillId);
          }

          const unlockedIds = skillTree.getUnlockedSkillIds();
          const unlockedSkills = SKILL_DEFINITIONS.filter((s) => unlockedIds.includes(s.id));

          // Invariant: For every unlocked skill at depth N >= 2,
          // there must exist at least one unlocked skill at depth N - 1 in the same branch.
          for (const skill of unlockedSkills) {
            if (skill.depth >= 2) {
              const hasPreceding = unlockedSkills.some(
                (s) => s.branch === skill.branch && s.depth === skill.depth - 1
              );
              expect(hasPreceding).toBe(true);
            }
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});
