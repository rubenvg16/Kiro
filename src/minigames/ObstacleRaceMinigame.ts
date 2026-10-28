import { Minigame, MinigameDefinition, MinigameResult } from './Minigame';

export class ObstacleRaceMinigame implements Minigame {
  public readonly definition: MinigameDefinition = {
    id: 'obstacle_race',
    displayName: 'Carrera de Obstáculos',
    description: 'Esquiva los conos y salta vallas en la pista escolar para marcar el mejor tiempo.',
    rules: 'Avanza por la pista esquivando conos y saltando las vallas. Cada fallo resta puntos de estilo.',
    controls: 'Espacio para saltar, Flechas o A/D para desplazarse lateralmente.'
  };

  private container: HTMLElement | null = null;
  private onComplete?: (result: MinigameResult) => void;
  private startTime = 0;
  private score = 0;
  private obstaclesPassed = 0;

  public start(container: HTMLElement, onComplete?: (result: MinigameResult) => void): void {
    this.container = container;
    this.onComplete = onComplete;
    this.startTime = Date.now();
    this.score = 100;
    this.obstaclesPassed = 0;

    this.render();
  }

  private render(): void {
    if (!this.container) return;

    this.container.innerHTML = `
      <div class="minigame-view obstacle-race-view">
        <div class="minigame-hud">
          <span>Puntos: <strong id="race-score">${this.score}</strong></span>
          <span>Obstáculos: <strong id="race-obstacles">${this.obstaclesPassed}/5</strong></span>
        </div>
        <div class="race-track" style="margin: 20px 0; padding: 20px; background: rgba(0,0,0,0.2); border-radius: 8px; text-align: center;">
          <div class="race-lane" style="display: flex; justify-content: space-around; font-size: 2rem;">
            ${[1, 2, 3, 4, 5].map(i => `
              <button class="btn btn-option race-step-btn" data-step="${i}" ${i === this.obstaclesPassed + 1 ? '' : 'disabled'}>
                🚧 Valla ${i}
              </button>
            `).join('')}
          </div>
        </div>
        <div style="text-align: center;">
          <button id="btn-finish-race" class="btn btn-success" ${this.obstaclesPassed >= 5 ? '' : 'disabled'}>
            ¡Cruzar la Meta!
          </button>
        </div>
      </div>
    `;

    this.container.querySelectorAll('.race-step-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        this.obstaclesPassed++;
        this.score += 20;
        this.render();
      });
    });

    this.container.querySelector('#btn-finish-race')?.addEventListener('click', () => {
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
      isNewBest: false, // Calculated by MinigameManager
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
