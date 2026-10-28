import { describe, it, expect, beforeEach } from 'vitest';
import fc from 'fast-check';
import { DialogueSystem } from '../../world/DialogueSystem';
import { NPC_PROFILES } from '../../world/NPCDialogueData';
import { HistoricalFiguresManager } from '../../world/HistoricalFiguresManager';

describe('NPC and Dialogue System Properties', () => {
  let dialogueSystem: DialogueSystem;

  beforeEach(() => {
    localStorage.clear();
    DialogueSystem.resetInstance();
    dialogueSystem = DialogueSystem.getInstance();
  });

  /**
   * Feature: complete-game-expansion, Property 5: NPC Relationship Score Clamping
   * Validates: Requirements 3.6
   */
  it('Property 5: Any sequence of delta modifications keeps NPC relationship score strictly in [-100, +100]', () => {
    const npcIds = Object.keys(NPC_PROFILES);
    expect(npcIds.length).toBeGreaterThanOrEqual(15);

    fc.assert(
      fc.property(
        fc.constantFrom(...npcIds),
        fc.array(fc.integer({ min: -500, max: 500 }), { minLength: 1, maxLength: 50 }),
        (npcId, deltas) => {
          for (const delta of deltas) {
            const result = dialogueSystem.modifyRelationship(npcId, delta);
            expect(result).toBeGreaterThanOrEqual(-100);
            expect(result).toBeLessThanOrEqual(100);
            expect(dialogueSystem.getRelationshipScore(npcId)).toBe(result);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('guarantees at least 15 distinct NPCs each with unique name, role, backstory, and portrait', () => {
    const profiles = Object.values(NPC_PROFILES);
    expect(profiles.length).toBeGreaterThanOrEqual(15);

    const ids = new Set<string>();
    const names = new Set<string>();

    for (const p of profiles) {
      expect(p.id).toBeDefined();
      expect(p.name).toBeDefined();
      expect(p.role).toBeDefined();
      expect(p.personality).toBeDefined();
      expect(p.backstory.length).toBeGreaterThan(20);
      expect(p.portrait).toBeDefined();
      expect(p.idleLines.length).toBeGreaterThanOrEqual(3);

      ids.add(p.id);
      names.add(p.name);
    }

    expect(ids.size).toBe(profiles.length);
    expect(names.size).toBe(profiles.length);
  });

  it('guarantees 6 historical figures each with at least 4 dialogue lines and unique puzzle ID', () => {
    const manager = new HistoricalFiguresManager();
    expect(manager.figures.length).toBe(6);

    const puzzleIds = new Set<string>();

    for (const figure of manager.figures) {
      expect(figure.dialogue.length).toBeGreaterThanOrEqual(4);
      expect(figure.puzzleId).toBeDefined();
      expect(figure.puzzleId.length).toBeGreaterThan(0);
      puzzleIds.add(figure.puzzleId);
    }

    expect(puzzleIds.size).toBe(6); // Every figure has a unique puzzle ID
  });

  it('rotates idle lines without immediate repetition', () => {
    const npcId = 'don_manuel';
    const line1 = dialogueSystem.getNextIdleLine(npcId);
    const line2 = dialogueSystem.getNextIdleLine(npcId);
    const line3 = dialogueSystem.getNextIdleLine(npcId);

    expect(line1).not.toBe(line2);
    expect(line2).not.toBe(line3);
  });
});
