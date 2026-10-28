import { Minigame, MinigameDefinition, MinigameResult } from './Minigame';

export class PhysicsLabyrinthMinigame implements Minigame {
  public readonly definition: MinigameDefinition = {
    id: 'physics_labyrinth',
    displayName: 'Laberinto de Física',
    description: 'Inclina la plataforma para guiar la esfera de acero hasta el orificio central evitando los agujeros.',
    rules: 'Guía la bola por la gravedad inclinando el plano. Evita los vórtices y alcanza la meta.',
    controls: 'Flechas de dirección o ratón para inclinar el tablero.',
    unlockTier: 'investigador'
  };

  private container: HTMLElement | null = null;
  private onComplete?: (result: MinigameResult) => void;
  private startTime = 0;
  private score = 0;
  private currentProgress = 0;

  public start(container: HTMLElement, onComplete?: (result: MinigameResult) => void): void {
    this.container = container;
    this.onComplete = onComplete;
    this.startTime = Date.now();
    this.score = 0;
    this.currentProgress = 0;

    this.render();
  }

  private render(): void {
    if (!this.container) return;

    this.container.innerHTML = `
      <div class="minigame-view labyrinth-view">
        <div class="minigame-hud">
          <span>Estabilidad del Giroscopio: <strong>${this.currentProgress * 25}%</strong></span>
        </div>
        <div style="text-align: center; margin: 25px 0;">
          <div style="font-size: 3rem; margin-bottom: 15px;">🌀 ⚪ 🎯</div>
          <p>Equilibra las 4 esquinas del plano para encarrilar la esfera:</p>
          <div style="display: flex; justify-content: center; gap: 10px; margin-top: 15px;">
            <button class="btn btn-option tilt-btn" data-axis="x">◀ Inclinar X</button>
            <button class="btn btn-option tilt-btn" data-axis="y">Inclinar Y ▶</button>
          </div>
        </div>
        <div style="text-align: center;">
          <button id="btn-finish-labyrinth" class="btn btn-success" ${this.currentProgress >= 4 ? '' : 'disabled'}>
            ¡Esfera en la Meta!
          </button>
        </div>
      </div>
    `;

    this.container.querySelectorAll('.tilt-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        if (this.currentProgress < 4) {
          this.currentProgress++;
          this.score += 40;
          this.render();
        }
      });
    });

    this.container.querySelector('#btn-finish-labyrinth')?.addEventListener('click', () => {
      const res = this.end();
      this.onComplete?.(res);
    });
  }

  public end(): MinigameResult {
    const durationMs = Date.now() - this.startTime;
    return {
      minigameId: this.definition.id,
      score: this.score,
      durationMs,
      isNewBest: false,
      xpEarned: 50,
      coinsEarned: 0
    };
  }

  public dispose(): void {
    if (this.container) {
      this.container.innerHTML = '';
      this.container = null;
    }
  }
}
