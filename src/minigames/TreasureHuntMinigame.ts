import { Minigame, MinigameDefinition, MinigameResult } from './Minigame';

export class TreasureHuntMinigame implements Minigame {
  public readonly definition: MinigameDefinition = {
    id: 'treasure_hunt',
    displayName: 'Búsqueda del Tesoro',
    description: 'Explora el patio y encuentra las monedas y cofres escondidos antes de que termine el tiempo.',
    rules: 'Sigue las pistas de proximidad. Recoge tantos cofres como puedas antes de que el reloj marque cero.',
    controls: 'Haz clic en los cofres para descubrir su contenido.'
  };

  private container: HTMLElement | null = null;
  private onComplete?: (result: MinigameResult) => void;
  private startTime = 0;
  private chestsFound = 0;
  private totalChests = 4;
  private score = 0;

  public start(container: HTMLElement, onComplete?: (result: MinigameResult) => void): void {
    this.container = container;
    this.onComplete = onComplete;
    this.startTime = Date.now();
    this.chestsFound = 0;
    this.score = 0;

    this.render();
  }

  private render(): void {
    if (!this.container) return;

    this.container.innerHTML = `
      <div class="minigame-view treasure-hunt-view">
        <div class="minigame-hud">
          <span>Cofres Descubiertos: <strong>${this.chestsFound}/${this.totalChests}</strong></span>
          <span>Puntos de Tesoro: <strong>${this.score}</strong></span>
        </div>
        <div class="treasure-grid" style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; margin: 20px 0;">
          ${Array(this.totalChests).fill(0).map((_, i) => `
            <button class="btn btn-option chest-btn" data-id="${i}" style="padding: 25px; font-size: 1.5rem;" ${i < this.chestsFound ? 'disabled' : ''}>
              ${i < this.chestsFound ? '✨ Cofre Abierto (+50)' : '📦 Cofre Cerrado'}
            </button>
          `).join('')}
        </div>
        <div style="text-align: center;">
          <button id="btn-finish-hunt" class="btn btn-success" ${this.chestsFound >= this.totalChests ? '' : 'disabled'}>
            Reclamar Botín
          </button>
        </div>
      </div>
    `;

    this.container.querySelectorAll('.chest-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        this.chestsFound++;
        this.score += 50;
        this.render();
      });
    });

    this.container.querySelector('#btn-finish-hunt')?.addEventListener('click', () => {
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
