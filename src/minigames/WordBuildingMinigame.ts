import { Minigame, MinigameDefinition, MinigameResult } from './Minigame';

export class WordBuildingMinigame implements Minigame {
  public readonly definition: MinigameDefinition = {
    id: 'word_building',
    displayName: 'Construcción de Palabras',
    description: 'Combina sílabas y letras para formar vocabulario avanzado y sinónimos.',
    rules: 'Selecciona las fichas de letras para formar palabras válidas del diccionario de la RAE.',
    controls: 'Clic en las letras en orden para construir la palabra y botón Enviar.',
    unlockTier: 'maestro'
  };

  private container: HTMLElement | null = null;
  private onComplete?: (result: MinigameResult) => void;
  private startTime = 0;
  private score = 0;
  private selectedLetters: string[] = [];
  private availableLetters = ['L', 'U', 'M', 'E', 'N'];
  private targetWord = 'LUMEN';

  public start(container: HTMLElement, onComplete?: (result: MinigameResult) => void): void {
    this.container = container;
    this.onComplete = onComplete;
    this.startTime = Date.now();
    this.score = 0;
    this.selectedLetters = [];

    this.render();
  }

  private render(): void {
    if (!this.container) return;

    this.container.innerHTML = `
      <div class="minigame-view word-building-view">
        <div class="minigame-hud">
          <span>Palabra Construida: <strong style="letter-spacing: 3px; font-size: 1.4rem;">${this.selectedLetters.join('') || '_ _ _ _ _'}</strong></span>
        </div>
        <div style="text-align: center; margin: 25px 0;">
          <p>Pulsa las letras para formar el término científico "LUMEN":</p>
          <div style="display: flex; justify-content: center; gap: 10px; margin: 15px 0;">
            ${this.availableLetters.map(letter => `
              <button class="btn btn-option letter-btn" data-letter="${letter}" style="font-size: 1.5rem; width: 50px; height: 50px;">
                ${letter}
              </button>
            `).join('')}
          </div>
          <button id="btn-reset-letters" class="btn btn-secondary btn-sm">Borrar</button>
        </div>
        <div style="text-align: center;">
          <button id="btn-submit-word" class="btn btn-success" ${this.selectedLetters.join('') === this.targetWord ? '' : 'disabled'}>
            ¡Validar Palabra!
          </button>
        </div>
      </div>
    `;

    this.container.querySelectorAll('.letter-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const letter = btn.getAttribute('data-letter');
        if (letter) {
          this.selectedLetters.push(letter);
          this.render();
        }
      });
    });

    this.container.querySelector('#btn-reset-letters')?.addEventListener('click', () => {
      this.selectedLetters = [];
      this.render();
    });

    this.container.querySelector('#btn-submit-word')?.addEventListener('click', () => {
      this.score = 200;
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
