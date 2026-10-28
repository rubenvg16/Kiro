import { describe, it, expect, beforeEach } from 'vitest';
import { MinigameManager } from '../../minigames/MinigameManager';
import { MathBasketballMinigame } from '../../minigames/MathBasketballMinigame';
import { EventBus } from '../../core/EventBus';
import { SaveSystem } from '../../storage/SaveSystem';
import { ProgressionManager } from '../../gamification/ProgressionManager';

describe('MinigameManager and 6 Minigames', () => {
  beforeEach(() => {
    localStorage.clear();
    SaveSystem.resetInstance();
    ProgressionManager.resetInstance();
    MinigameManager.resetInstance();
  });

  it('registers at least 6 distinct minigames on initialization', () => {
    const manager = MinigameManager.getInstance();
    const minigames = manager.getAllMinigames();

    expect(minigames.length).toBeGreaterThanOrEqual(6);
    const ids = minigames.map((m) => m.definition.id);
    expect(ids).toContain('obstacle_race');
    expect(ids).toContain('treasure_hunt');
    expect(ids).toContain('math_basketball');
    expect(ids).toContain('typing_race');
    expect(ids).toContain('physics_labyrinth');
    expect(ids).toContain('word_building');
  });

  it('progressively unlocks minigames: first 2 available from start, others require quest or tier', () => {
    const manager = MinigameManager.getInstance();

    // Default start state
    expect(manager.isUnlocked('obstacle_race')).toBe(true);
    expect(manager.isUnlocked('treasure_hunt')).toBe(true);
    expect(manager.isUnlocked('math_basketball')).toBe(false);
    expect(manager.isUnlocked('typing_race')).toBe(false);
    expect(manager.isUnlocked('physics_labyrinth')).toBe(false);
    expect(manager.isUnlocked('word_building')).toBe(false);

    // Mock quest completion for math_basketball
    SaveSystem.getInstance().save({
      narrative: {
        completedQuestIds: ['reto_deportivo_1'],
        activeQuestIds: [],
        dialogueChoices: {},
        relationships: {},
        discoveredSecrets: []
      }
    });

    expect(manager.isUnlocked('math_basketball')).toBe(true);
    expect(manager.isUnlocked('typing_race')).toBe(false);

    // Mock level 5 (Investigador tier)
    SaveSystem.getInstance().save({
      progression: {
        level: 5,
        xp: 500,
        xpToNextLevel: 300,
        coins: 100,
        rankTitle: 'Investigador Escolar',
        unlockedItems: [],
        unlockedRelics: [],
        completedQuests: []
      }
    });

    expect(manager.isUnlocked('physics_labyrinth')).toBe(true);
    expect(manager.isUnlocked('word_building')).toBe(false);
  });

  it('handles completion, awards 50 XP, and grants 25 coins bonus on new personal record', () => {
    const manager = MinigameManager.getInstance();
    const progression = ProgressionManager.getInstance();
    const initialXP = progression.progress.xp;
    const initialCoins = progression.progress.coins;

    let eventEmitted = false;
    let eventData: any = null;
    EventBus.getInstance().on('minigame:ended', (data) => {
      eventEmitted = true;
      eventData = data;
    });

    manager.handleMinigameCompletion({
      minigameId: 'obstacle_race',
      score: 120,
      durationMs: 15000,
      isNewBest: false,
      xpEarned: 0,
      coinsEarned: 0
    });

    expect(eventEmitted).toBe(true);
    expect(eventData.isNewBest).toBe(true);
    expect(eventData.score).toBe(120);

    // Verify rewards: +50 XP and +25 coins on new record
    expect(progression.progress.xp).toBe(initialXP + 50);
    expect(progression.progress.coins).toBe(initialCoins + 25);
    expect(manager.getBestScore('obstacle_race')).toBe(120);

    // Second run with lower score should not award coin bonus
    const xpBeforeSecond = progression.progress.xp;
    const coinsBeforeSecond = progression.progress.coins;

    manager.handleMinigameCompletion({
      minigameId: 'obstacle_race',
      score: 100,
      durationMs: 18000,
      isNewBest: false,
      xpEarned: 0,
      coinsEarned: 0
    });

    expect(progression.progress.xp).toBe(xpBeforeSecond + 50);
    expect(progression.progress.coins).toBe(coinsBeforeSecond); // No extra coins
    expect(manager.getBestScore('obstacle_race')).toBe(120); // Best remains 120
  });

  it('MathBasketballMinigame generates arithmetic questions with exactly one matching correct answer', () => {
    const basketball = new MathBasketballMinigame();

    for (let i = 0; i < 20; i++) {
      const q = basketball.generateQuestion();
      expect(q.options).toContain(q.correctAnswer);
      expect(q.options.length).toBe(4);
      // Ensure options are unique
      const unique = new Set(q.options);
      expect(unique.size).toBe(4);
    }
  });

  it('launch opens rules screen and toggles minigame mode', () => {
    const manager = MinigameManager.getInstance();
    const launched = manager.launch('obstacle_race');

    expect(launched).toBe(true);
    expect(document.body.classList.contains('minigame-mode-active')).toBe(true);

    manager.endActive();
    expect(document.body.classList.contains('minigame-mode-active')).toBe(false);
  });
});
