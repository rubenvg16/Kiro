import { EventBus } from '../core/EventBus';
import { SaveSystem } from '../storage/SaveSystem';

export interface InteractionRecord {
  timestamp: number;
  correct: boolean;
}

export interface AdaptiveState {
  windowSize: number;
  recentInteractions: InteractionRecord[];
  hintsEnabled: boolean;
  timerReductionFactor: number;
  xpMultiplier: number;
  difficultyTierOverride?: 'explorador' | 'investigador' | 'maestro';
}

export class AdaptiveDifficulty {
  private static instance: AdaptiveDifficulty | null = null;
  private readonly windowSize = 10;
  private recentInteractions: InteractionRecord[] = [];
  private difficultyTierOverride?: 'explorador' | 'investigador' | 'maestro';

  private constructor() {
    this.hydrateFromSaveSystem();
    this.subscribeToEvents();
  }

  public static getInstance(): AdaptiveDifficulty {
    if (!AdaptiveDifficulty.instance) {
      AdaptiveDifficulty.instance = new AdaptiveDifficulty();
    }
    return AdaptiveDifficulty.instance;
  }

  public static resetInstance(): void {
    AdaptiveDifficulty.instance = null;
  }

  private hydrateFromSaveSystem(): void {
    try {
      const save = SaveSystem.getInstance().load();
      if (save && save.adaptive) {
        if (Array.isArray(save.adaptive.recentInteractions)) {
          this.recentInteractions = save.adaptive.recentInteractions.slice(-this.windowSize).map(item => {
            if (typeof item === 'boolean') {
              return { timestamp: Date.now(), correct: item };
            }
            if (item && typeof item === 'object' && 'correct' in item) {
              return item as InteractionRecord;
            }
            return { timestamp: Date.now(), correct: Boolean(item) };
          });
        }
        if (save.adaptive.difficultyTierOverride) {
          this.difficultyTierOverride = save.adaptive.difficultyTierOverride;
        }
      }
    } catch {
      // Fallback to empty state
      this.recentInteractions = [];
    }
  }

  private subscribeToEvents(): void {
    EventBus.getInstance().on('puzzle:answered', (data) => {
      this.recordInteraction(data.correct);
    });
  }

  /**
   * Records a puzzle/challenge interaction (correct or incorrect)
   * keeping at most the last 10 interactions.
   */
  public recordInteraction(correct: boolean): void {
    this.recentInteractions.push({
      timestamp: Date.now(),
      correct
    });

    if (this.recentInteractions.length > this.windowSize) {
      this.recentInteractions.shift();
    }

    this.persist();
  }

  /**
   * Returns the success rate in the closed interval [0, 1].
   * Invariant: trueCount / Math.max(1, records.length)
   */
  public getSuccessRate(): number {
    if (this.recentInteractions.length === 0) {
      return 1.0; // Default when no interactions exist
    }

    const trueCount = this.recentInteractions.filter(r => r.correct).length;
    return trueCount / Math.max(1, this.recentInteractions.length);
  }

  /**
   * If success rate < 40%, hints should be shown.
   */
  public shouldShowHint(): boolean {
    if (this.recentInteractions.length === 0) return false;
    return this.getSuccessRate() < 0.4;
  }

  /**
   * If success rate < 40%, active timer is reduced by 20% (baseSecs * 0.8).
   * Otherwise returns baseSecs unchanged.
   */
  public getAdjustedTimer(baseSecs: number): number {
    if (this.recentInteractions.length > 0 && this.getSuccessRate() < 0.4) {
      return Math.round(baseSecs * 0.8);
    }
    return baseSecs;
  }

  /**
   * If success rate > 85%, XP multiplier is 0.7 (-30% reward for easy questions).
   * Otherwise returns 1.0.
   */
  public getXpMultiplier(): number {
    if (this.recentInteractions.length > 0 && this.getSuccessRate() > 0.85) {
      return 0.7;
    }
    return 1.0;
  }

  /**
   * If success rate > 85%, should surface harder questions.
   */
  public shouldSurfaceHarderQuestions(): boolean {
    if (this.recentInteractions.length === 0) return false;
    return this.getSuccessRate() > 0.85;
  }

  public setDifficultyTierOverride(tier?: 'explorador' | 'investigador' | 'maestro'): void {
    this.difficultyTierOverride = tier;
    this.persist();
  }

  public getDifficultyTierOverride(): 'explorador' | 'investigador' | 'maestro' | undefined {
    return this.difficultyTierOverride;
  }

  public getRecentInteractions(): InteractionRecord[] {
    return [...this.recentInteractions];
  }

  public clearInteractions(): void {
    this.recentInteractions = [];
    this.persist();
  }

  public serialize(): AdaptiveState {
    return {
      windowSize: this.windowSize,
      recentInteractions: [...this.recentInteractions],
      hintsEnabled: this.shouldShowHint(),
      timerReductionFactor: this.recentInteractions.length > 0 && this.getSuccessRate() < 0.4 ? 0.8 : 1.0,
      xpMultiplier: this.getXpMultiplier(),
      difficultyTierOverride: this.difficultyTierOverride
    };
  }

  public hydrate(state: Partial<AdaptiveState>): void {
    if (state.recentInteractions && Array.isArray(state.recentInteractions)) {
      this.recentInteractions = state.recentInteractions.slice(-this.windowSize);
    }
    if (state.difficultyTierOverride !== undefined) {
      this.difficultyTierOverride = state.difficultyTierOverride;
    }
    this.persist();
  }

  private persist(): void {
    try {
      SaveSystem.getInstance().save({
        adaptive: {
          recentInteractions: this.recentInteractions.map(r => r.correct),
          difficultyTierOverride: this.difficultyTierOverride
        }
      });
    } catch {
      // Safe fallback if SaveSystem is not available in test
    }
  }
}
