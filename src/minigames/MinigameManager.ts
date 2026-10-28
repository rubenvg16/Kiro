import { Minigame, MinigameResult } from './Minigame';
import { ObstacleRaceMinigame } from './ObstacleRaceMinigame';
import { TreasureHuntMinigame } from './TreasureHuntMinigame';
import { MathBasketballMinigame } from './MathBasketballMinigame';
import { TypingRaceMinigame } from './TypingRaceMinigame';
import { PhysicsLabyrinthMinigame } from './PhysicsLabyrinthMinigame';
import { WordBuildingMinigame } from './WordBuildingMinigame';
import { EventBus } from '../core/EventBus';
import { SaveSystem } from '../storage/SaveSystem';
import { ProgressionManager } from '../gamification/ProgressionManager';

export class MinigameManager {
  private static instance: MinigameManager | null = null;
  private registry: Map<string, Minigame> = new Map();
  private activeMinigame: Minigame | null = null;

  private modalElem: HTMLElement | null = null;
  private contentElem: HTMLElement | null = null;

  private constructor() {
    this.createDOM();
    this.registerDefaults();
  }

  public static getInstance(): MinigameManager {
    if (!MinigameManager.instance) {
      MinigameManager.instance = new MinigameManager();
    }
    return MinigameManager.instance;
  }

  public static resetInstance(): void {
    if (MinigameManager.instance) {
      MinigameManager.instance.endActive();
    }
    MinigameManager.instance = null;
  }

  private registerDefaults(): void {
    this.register(new ObstacleRaceMinigame());
    this.register(new TreasureHuntMinigame());
    this.register(new MathBasketballMinigame());
    this.register(new TypingRaceMinigame());
    this.register(new PhysicsLabyrinthMinigame());
    this.register(new WordBuildingMinigame());
  }

  private createDOM(): void {
    if (typeof document === 'undefined') return;

    let wrapper = document.getElementById('minigame-modal');
    if (!wrapper) {
      wrapper = document.createElement('div');
      wrapper.id = 'minigame-modal';
      wrapper.className = 'modal hidden';
      wrapper.innerHTML = `
        <div class="modal-content large minigame-box">
          <div class="minigame-header">
            <h3 id="minigame-title">Minijuego</h3>
            <button id="btn-close-minigame" class="btn-icon">✕</button>
          </div>
          <div id="minigame-body" class="minigame-interactive-area"></div>
        </div>
      `;
      document.body.appendChild(wrapper);
    }

    this.modalElem = wrapper;
    this.contentElem = wrapper.querySelector('#minigame-body');

    wrapper.querySelector('#btn-close-minigame')?.addEventListener('click', () => {
      this.endActive();
      this.closeModal();
    });
  }

  public register(minigame: Minigame): void {
    this.registry.set(minigame.definition.id, minigame);
  }

  public getMinigame(id: string): Minigame | undefined {
    return this.registry.get(id);
  }

  public getAllMinigames(): Minigame[] {
    return Array.from(this.registry.values());
  }

  public getBestScore(minigameId: string): number {
    try {
      const val = localStorage.getItem(`kiro_minigame_best_${minigameId}`);
      if (val !== null) {
        const num = parseInt(val, 10);
        return isNaN(num) ? 0 : num;
      }
    } catch {
      // Ignore storage error
    }
    return 0;
  }

  public saveBestScore(minigameId: string, score: number): boolean {
    const currentBest = this.getBestScore(minigameId);
    if (score > currentBest) {
      try {
        localStorage.setItem(`kiro_minigame_best_${minigameId}`, score.toString());
      } catch {
        // Ignore
      }
      return true;
    }
    return false;
  }

  public isUnlocked(minigameId: string): boolean {
    const minigame = this.registry.get(minigameId);
    if (!minigame) return false;

    // The first 2 minigames are unlocked from the start
    if (minigameId === 'obstacle_race' || minigameId === 'treasure_hunt') {
      return true;
    }

    try {
      const save = SaveSystem.getInstance().load();
      const completedQuests = save?.narrative?.completedQuestIds || save?.progression?.completedQuests || [];
      const playerLevel = save?.progression?.level || 1;

      // Quest requirement check
      if (minigame.definition.unlockQuestId) {
        if (completedQuests.includes(minigame.definition.unlockQuestId)) {
          return true;
        }
      }

      // Difficulty Tier requirement check
      if (minigame.definition.unlockTier) {
        if (minigame.definition.unlockTier === 'investigador' && playerLevel >= 5) {
          return true;
        }
        if (minigame.definition.unlockTier === 'maestro' && playerLevel >= 9) {
          return true;
        }
      }
    } catch {
      // Safe fallback
    }

    return false;
  }

  /**
   * Launches a minigame:
   * 1. Checks unlock status.
   * 2. Displays the rules screen with objective, controls and personal best.
   * 3. Disables HUD elements not relevant to minigame.
   */
  public launch(minigameId: string): boolean {
    const minigame = this.registry.get(minigameId);
    if (!minigame) return false;
    if (!this.isUnlocked(minigameId)) return false;

    this.endActive();
    this.activeMinigame = minigame;

    // Disable HUD elements during active minigame session (Req 8.7)
    if (typeof document !== 'undefined') {
      document.body.classList.add('minigame-mode-active');
      const hud = document.getElementById('hud');
      if (hud) hud.classList.add('hud-minigame-hidden');
    }

    this.showRulesScreen(minigame);
    return true;
  }

  private showRulesScreen(minigame: Minigame): void {
    if (!this.contentElem || !this.modalElem) return;

    const titleElem = this.modalElem.querySelector('#minigame-title');
    if (titleElem) titleElem.textContent = minigame.definition.displayName;

    const bestScore = this.getBestScore(minigame.definition.id);

    this.contentElem.innerHTML = `
      <div class="minigame-rules-screen" style="text-align: center; padding: 15px;">
        <h4 style="margin-bottom: 12px;">${minigame.definition.displayName}</h4>
        <p class="minigame-desc" style="color: var(--text-muted); margin-bottom: 16px;">${minigame.definition.description}</p>
        
        <div class="rules-card" style="background: rgba(255,255,255,0.05); padding: 16px; border-radius: 8px; margin-bottom: 16px; text-align: left;">
          <p><strong>🎯 Objetivo:</strong> ${minigame.definition.rules}</p>
          <p><strong>🎮 Controles:</strong> ${minigame.definition.controls}</p>
          <p><strong>🏆 Mejor Puntuación Personal:</strong> <span style="color: #f59e0b; font-weight: bold;">${bestScore} pts</span></p>
        </div>

        <button id="btn-start-minigame" class="btn btn-success" style="font-size: 1.1rem; padding: 10px 24px;">
          ¡Empezar a Jugar!
        </button>
      </div>
    `;

    this.openModal();

    this.contentElem.querySelector('#btn-start-minigame')?.addEventListener('click', () => {
      this.startActiveMinigame();
    });
  }

  private startActiveMinigame(): void {
    if (!this.activeMinigame || !this.contentElem) return;

    this.activeMinigame.start(this.contentElem, (result: MinigameResult) => {
      this.handleMinigameCompletion(result);
    });
  }

  public handleMinigameCompletion(result: MinigameResult): void {
    const isNewBest = this.saveBestScore(result.minigameId, result.score);
    result.isNewBest = isNewBest;

    const coinsEarned = isNewBest ? 25 : 0;
    result.coinsEarned = coinsEarned;
    result.xpEarned = 50;

    // Apply progression rewards
    const progression = ProgressionManager.getInstance();
    progression.addXP(result.xpEarned, false);
    if (coinsEarned > 0) {
      progression.addCoins(coinsEarned, false);
    }
    progression.saveProgress();

    // Emit event
    EventBus.getInstance().emit('minigame:ended', {
      minigameId: result.minigameId,
      score: result.score,
      isNewBest
    });

    this.showResultScreen(result);
  }

  private showResultScreen(result: MinigameResult): void {
    if (!this.contentElem) return;

    const seconds = (result.durationMs / 1000).toFixed(1);
    const bestScore = this.getBestScore(result.minigameId);

    this.contentElem.innerHTML = `
      <div class="minigame-result-screen" style="text-align: center; padding: 20px;">
        <h3>🏁 ¡Partida Finalizada!</h3>
        ${
          result.isNewBest
            ? `
          <div class="new-record-banner" style="animation: bounce 0.6s infinite alternate; color: #fbbf24; font-size: 1.3rem; margin: 12px 0;">
            ⭐ ¡NUEVO RÉCORD PERSONAL! (+25 Monedas 🪙)
          </div>
        `
            : ''
        }
        <div class="result-stats" style="margin: 20px auto; max-width: 320px; text-align: left; background: rgba(0,0,0,0.2); padding: 16px; border-radius: 8px;">
          <p>Puntuación: <strong>${result.score} pts</strong></p>
          <p>Tiempo empleado: <strong>${seconds} s</strong></p>
          <p>Mejor marca: <strong>${bestScore} pts</strong></p>
          <p>Recompensa: <strong>+${result.xpEarned} XP</strong> ${result.coinsEarned > 0 ? `y <strong>+${result.coinsEarned} Monedas</strong>` : ''}</p>
        </div>

        <button id="btn-exit-minigame" class="btn btn-primary" style="margin-top: 10px;">
          Volver al Patio Escolar
        </button>
      </div>
    `;

    this.contentElem.querySelector('#btn-exit-minigame')?.addEventListener('click', () => {
      this.endActive();
      this.closeModal();
    });
  }

  public endActive(): void {
    if (this.activeMinigame) {
      this.activeMinigame.dispose();
      this.activeMinigame = null;
    }

    if (typeof document !== 'undefined') {
      document.body.classList.remove('minigame-mode-active');
      const hud = document.getElementById('hud');
      if (hud) hud.classList.remove('hud-minigame-hidden');
    }
  }

  public openModal(): void {
    if (this.modalElem) this.modalElem.classList.remove('hidden');
  }

  public closeModal(): void {
    if (this.modalElem) this.modalElem.classList.add('hidden');
  }
}
