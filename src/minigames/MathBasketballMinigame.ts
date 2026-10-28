import { Minigame, MinigameDefinition, MinigameResult } from './Minigame';

export interface MathQuestion {
  prompt: string;
  correctAnswer: number;
  options: number[];
}

export class MathBasketballMinigame implements Minigame {
  public readonly definition: MinigameDefinition = {
    id: 'math_basketball',
    displayName: 'Baloncesto Matemático',
    description: 'Encesta balones calculando el resultado exacto de operaciones aritméticas.',
    rules: 'Calcula la operación mentalmente y selecciona el balón con la respuesta numérica correcta.',
    controls: 'Haz clic en el balón correcto para encestar en la canasta.',
    unlockQuestId: 'reto_deportivo_1'
  };

  private container: HTMLElement | null = null;
  private onComplete?: (result: MinigameResult) => void;
  private startTime = 0;
  private score = 0;
  private currentRound = 0;
  private totalRounds = 3;
  private currentQuestion: MathQuestion | null = null;

  public start(container: HTMLElement, onComplete?: (result: MinigameResult) => void): void {
    this.container = container;
    this.onComplete = onComplete;
    this.startTime = Date.now();
    this.score = 0;
    this.currentRound = 0;

    this.nextQuestion();
  }

  public generateQuestion(): MathQuestion {
    const ops = ['+', '-', '×'];
    const op = ops[Math.floor(Math.random() * ops.length)];
    let a = Math.floor(Math.random() * 12) + 2;
    let b = Math.floor(Math.random() * 12) + 2;
    let correct = 0;

    if (op === '+') {
      correct = a + b;
    } else if (op === '-') {
      if (a < b) [a, b] = [b, a];
      correct = a - b;
    } else {
      a = Math.floor(Math.random() * 9) + 2;
      b = Math.floor(Math.random() * 9) + 2;
      correct = a * b;
    }

    const options = new Set<number>([correct]);
    while (options.size < 4) {
      const delta = (Math.floor(Math.random() * 7) + 1) * (Math.random() > 0.5 ? 1 : -1);
      const wrong = Math.max(0, correct + delta);
      options.add(wrong);
    }

    return {
      prompt: `¿Cuánto es ${a} ${op} ${b}?`,
      correctAnswer: correct,
      options: Array.from(options).sort(() => 0.5 - Math.random())
    };
  }

  private nextQuestion(): void {
    if (this.currentRound >= this.totalRounds) {
      this.finish();
      return;
    }

    this.currentRound++;
    this.currentQuestion = this.generateQuestion();
    this.render();
  }

  private render(): void {
    if (!this.container || !this.currentQuestion) return;

    this.container.innerHTML = `
      <div class="minigame-view basketball-view">
        <div class="minigame-hud">
          <span>Canastas: <strong>${this.currentRound}/${this.totalRounds}</strong></span>
          <span>Puntos: <strong>${this.score}</strong></span>
        </div>
        <div style="text-align: center; margin: 20px 0;">
          <h3 class="math-prompt" style="font-size: 1.8rem;">🏀 ${this.currentQuestion.prompt}</h3>
          <p>Selecciona el balón con el número exacto para encestar:</p>
          <div class="basketballs-container" style="display: flex; justify-content: center; gap: 15px; margin-top: 20px;">
            ${this.currentQuestion.options.map(opt => `
              <button class="btn btn-option ball-btn" data-value="${opt}" style="width: 70px; height: 70px; border-radius: 50%; font-size: 1.3rem; font-weight: bold; background: #ea580c; color: white;">
                ${opt}
              </button>
            `).join('')}
          </div>
        </div>
        <div id="basketball-feedback" style="text-align: center; min-height: 24px; font-weight: bold;"></div>
      </div>
    `;

    const feedback = this.container.querySelector('#basketball-feedback');
    this.container.querySelectorAll('.ball-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const val = parseInt(btn.getAttribute('data-value') || '-1', 10);
        if (this.currentQuestion && val === this.currentQuestion.correctAnswer) {
          this.score += 50;
          if (feedback) feedback.textContent = '🎉 ¡CANASTA LIMPIA!';
          setTimeout(() => this.nextQuestion(), 600);
        } else {
          if (feedback) feedback.textContent = '❌ ¡Tiro fallado! Inténtalo con el balón correcto.';
        }
      });
    });
  }

  private finish(): void {
    const res = this.end();
    this.onComplete?.(res);
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
