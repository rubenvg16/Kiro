import { describe, it, expect, beforeEach } from 'vitest';
import { PuzzleEngine } from '../../puzzles/PuzzleEngine';
import { HYBRID_CHALLENGE_DEFINITIONS } from '../../puzzles/HybridChallengeDefinitions';
import { PuzzlePhase } from '../../puzzles/types';
import { EventBus } from '../../core/EventBus';
import { SaveSystem } from '../../storage/SaveSystem';
import { ProgressionManager } from '../../gamification/ProgressionManager';

describe('PuzzleEngine & HybridChallenges', () => {
  beforeEach(() => {
    localStorage.clear();
    SaveSystem.resetInstance();
    PuzzleEngine.resetInstance();
    ProgressionManager.resetInstance();
  });

  it('provides at least 12 distinct hybrid challenges covering all 5 subjects', () => {
    expect(HYBRID_CHALLENGE_DEFINITIONS.length).toBeGreaterThanOrEqual(12);

    const subjects = new Set(HYBRID_CHALLENGE_DEFINITIONS.map((c) => c.subject));
    expect(subjects.has('Matemáticas')).toBe(true);
    expect(subjects.has('Lengua')).toBe(true);
    expect(subjects.has('Ciencias')).toBe(true);
    expect(subjects.has('Historia')).toBe(true);
    expect(subjects.has('Tecnología')).toBe(true);
  });

  it('validates that all predefined hybrid challenges have alternating mechanical and quiz phases (min 2 each)', () => {
    const engine = PuzzleEngine.getInstance();
    for (const challenge of HYBRID_CHALLENGE_DEFINITIONS) {
      expect(challenge.phases.length).toBeGreaterThanOrEqual(4);
      expect(engine.validateHybridChallengePhases(challenge.phases)).toBe(true);
    }
  });

  it('rejects a challenge that fails to alternate phases', () => {
    const engine = PuzzleEngine.getInstance();
    const invalidPhases: PuzzlePhase[] = [
      {
        type: 'mechanical',
        parTimeSeconds: 30,
        content: { mechanic: 'balance', obstacleCount: 1 }
      },
      {
        type: 'mechanical', // Non-alternating!
        parTimeSeconds: 30,
        content: { mechanic: 'platforming', obstacleCount: 1 }
      },
      {
        type: 'quiz',
        parTimeSeconds: 30,
        content: {
          question: 'Q',
          correctAnswer: 'A',
          distractors: ['B'],
          explanation: '',
          subject: 'Matemáticas',
          difficulty: 'easy'
        }
      },
      {
        type: 'quiz',
        parTimeSeconds: 30,
        content: {
          question: 'Q2',
          correctAnswer: 'A2',
          distractors: ['B2'],
          explanation: '',
          subject: 'Matemáticas',
          difficulty: 'easy'
        }
      }
    ];

    expect(engine.validateHybridChallengePhases(invalidPhases)).toBe(false);
    expect(() => {
      engine.launchHybridChallenge({
        id: 'invalid_challenge',
        title: 'Invalido',
        phases: invalidPhases,
        difficulty: 'easy',
        parTimeSeconds: 120
      });
    }).toThrow();
  });

  it('allows setting and reading difficulty', () => {
    const engine = PuzzleEngine.getInstance();
    expect(engine.getDifficulty()).toBe('medium');
    engine.setDifficulty('hard');
    expect(engine.getDifficulty()).toBe('hard');
    engine.setDifficulty('easy');
    expect(engine.getDifficulty()).toBe('easy');
  });

  it('persists best scores per puzzle in storage', () => {
    const engine = PuzzleEngine.getInstance();
    expect(engine.getBestScore('test_puzzle')).toBeNull();

    engine.saveBestScore('test_puzzle', 80);
    expect(engine.getBestScore('test_puzzle')).toBe(80);

    // Only overwrites if higher
    engine.saveBestScore('test_puzzle', 70);
    expect(engine.getBestScore('test_puzzle')).toBe(80);

    engine.saveBestScore('test_puzzle', 95);
    expect(engine.getBestScore('test_puzzle')).toBe(95);
  });

  it('awards and tracks gold medals', () => {
    const engine = PuzzleEngine.getInstance();
    expect(engine.hasGoldMedal('test_puzzle')).toBe(false);

    let eventFired = false;
    EventBus.getInstance().on('achievement:unlocked', (d) => {
      if (d.achievementId === 'gold_medal_test_puzzle') eventFired = true;
    });

    engine.awardGoldMedal('test_puzzle');
    expect(engine.hasGoldMedal('test_puzzle')).toBe(true);
    expect(eventFired).toBe(true);
  });
});
