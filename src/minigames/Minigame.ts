export interface MinigameDefinition {
  id: string;
  displayName: string;
  description: string;
  rules: string;
  controls: string;
  unlockQuestId?: string;
  unlockTier?: 'explorador' | 'investigador' | 'maestro';
}

export interface MinigameResult {
  minigameId: string;
  score: number;
  durationMs: number;
  isNewBest: boolean;
  xpEarned: number;
  coinsEarned: number; // +25 bonus if new best
}

/**
 * Strategy pattern interface for all minigames in Kiro.
 */
export interface Minigame {
  readonly definition: MinigameDefinition;
  start(container: HTMLElement, onComplete?: (result: MinigameResult) => void): void;
  end(): MinigameResult;
  dispose(): void;
}
