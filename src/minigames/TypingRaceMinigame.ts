import { Minigame, MinigameDefinition, MinigameResult } from './Minigame';

export class TypingRaceMinigame implements Minigame {
  public readonly definition: MinigameDefinition = {
    id: 'typing_race',
    displayName: 'Torneo de Velocidad de Escritura',
    description: 'Teclea las citas literarias y palabras cultas lo más rápido posible sin cometer erratas.',
    rules: 'Escribe las palabras que aparecen en pantalla con la mayor precisión y velocidad (palabras por minuto).',
    controls: 'Teclado directo.',
    unlockQuestId: 'misterio_biblioteca_1'
  };

  private container: HTMLElement | null = null;
  private onComplete?: (result: MinigameResult) => void;
  private startTime = 0;
  private score = 0;
  private targetPhrase = 'SABIDURIA';

  public start(container: HTMLElement, onComplete?: (result: MinigameResult) => void): void {
    this.container = container;
    this.onComplete = onComplete;
    this.startTime = Date.now();
    this.score = 0;

    this.render();
  }

  private render(): void {
    if (!this.container) return;

    this.container.innerHTML = `
      <div class="minigame-view typing-race-view">
        <div class="minigame-hud">
          <span>Palabra Objetivo: <strong style="letter-spacing: 2px;">${this.targetPhrase}</strong></span>
        </div>
        <div style="text-align: center; margin: 25px 0;">
          <input type="text" id="typing-input" class="text-input" placeholder="Escribe aquí..." autofocus style="font-size: 1.5rem; text-align: center; max-width: 300px;" />
        </div>
        <div id="typing-status" style="text-align: center; min-height: 24px;"></div>
      </div>
    `;

    const input = this.container.querySelector('#typing-input') as HTMLInputElement;
    const status = this.container.querySelector('#typing-status');

    input?.addEventListener('input', () => {
      if (input.value.trim().toUpperCase() === this.targetPhrase) {
        this.score = 150;
        if (status) status.innerHTML = '⚡ <strong>¡Completado con éxito!</strong>';
        setTimeout(() => {
          const res = this.end();
          this.onComplete?.(res);
        }, 500);
      }
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
