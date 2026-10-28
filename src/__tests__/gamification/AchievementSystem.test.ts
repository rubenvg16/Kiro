import { describe, it, expect, beforeEach } from 'vitest';
import { AchievementSystem } from '../../gamification/AchievementSystem';
import { ACHIEVEMENT_DEFINITIONS } from '../../gamification/AchievementDefinitions';
import { EventBus } from '../../core/EventBus';
import { SaveSystem } from '../../storage/SaveSystem';
import { ProgressionManager } from '../../gamification/ProgressionManager';

describe('AchievementSystem', () => {
  beforeEach(() => {
    localStorage.clear();
    SaveSystem.resetInstance();
    ProgressionManager.resetInstance();
    AchievementSystem.resetInstance();
  });

  it('registers at least 30 achievements across 6 categories', () => {
    expect(ACHIEVEMENT_DEFINITIONS.length).toBeGreaterThanOrEqual(30);

    const categories = new Set(ACHIEVEMENT_DEFINITIONS.map((a) => a.category));
    expect(categories.has('exploration')).toBe(true);
    expect(categories.has('academic')).toBe(true);
    expect(categories.has('quest')).toBe(true);
    expect(categories.has('puzzle')).toBe(true);
    expect(categories.has('social')).toBe(true);
    expect(categories.has('hidden')).toBe(true);

    const hiddenAchievements = ACHIEVEMENT_DEFINITIONS.filter((a) => a.category === 'hidden');
    expect(hiddenAchievements.length).toBeGreaterThanOrEqual(6);
  });

  it('awards coin reward (20-200) and unlocks achievement on event dispatch', () => {
    const system = AchievementSystem.getInstance();
    const progression = ProgressionManager.getInstance();
    const initialCoins = progression.progress.coins;

    let eventEmitted = false;
    EventBus.getInstance().on('achievement:unlocked', (d) => {
      if (d.achievementId === 'ach_first_steps') eventEmitted = true;
    });

    // Enter a zone to trigger 'ach_first_steps'
    EventBus.getInstance().emit('zone:entered', { zoneId: 'patio_central' });

    expect(system.isUnlocked('ach_first_steps')).toBe(true);
    expect(eventEmitted).toBe(true);
    expect(progression.progress.coins).toBe(initialCoins + 25);
  });

  it('tracks progress correctly for multi-step achievements', () => {
    const system = AchievementSystem.getInstance();
    expect(system.getProgress('ach_school_cartographer')).toBe(0);

    // 2 zones visited out of 4 threshold
    system.setCounter('zone', 2);
    expect(system.getProgress('ach_school_cartographer')).toBe(0.5);

    // 4 zones visited
    system.setCounter('zone', 4);
    system.checkAll();
    expect(system.isUnlocked('ach_school_cartographer')).toBe(true);
    expect(system.getProgress('ach_school_cartographer')).toBe(1.0);
  });
});
