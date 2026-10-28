import { ProgressionManager } from '../gamification/ProgressionManager';
import { EventBus } from '../core/EventBus';
import { AdaptiveDifficulty } from './AdaptiveDifficulty';
import { caesarCipher } from './caesarCipher';
import {
  HybridChallenge,
  PuzzleDifficulty,
  PuzzlePhase,
  PuzzleSession,
  QuizPhaseContent,
  MechanicalPhaseContent
} from './types';

export { caesarCipher };

export interface PuzzleResult {
  solved: boolean;
  xpEarned: number;
  coinsEarned: number;
  relicUnlocked?: string;
  isPerfect?: boolean;
}

export class PuzzleEngine {
  private static instance: PuzzleEngine;
  private modalElem: HTMLElement | null = null;
  private contentElem: HTMLElement | null = null;
  private titleElem: HTMLElement | null = null;

  private currentDifficulty: PuzzleDifficulty = 'medium';
  private currentSession: PuzzleSession | null = null;
  private activeTimerInterval: any = null;

  private constructor() {
    this.createDOM();
  }

  public static getInstance(): PuzzleEngine {
    if (!PuzzleEngine.instance) {
      PuzzleEngine.instance = new PuzzleEngine();
    }
    return PuzzleEngine.instance;
  }

  public static resetInstance(): void {
    if (PuzzleEngine.instance && PuzzleEngine.instance.activeTimerInterval) {
      clearInterval(PuzzleEngine.instance.activeTimerInterval);
    }
    PuzzleEngine.instance = null as any;
  }

  public static caesar(text: string, shift: number): string {
    return caesarCipher(text, shift);
  }

  public setDifficulty(diff: PuzzleDifficulty): void {
    this.currentDifficulty = diff;
  }

  public getDifficulty(): PuzzleDifficulty {
    return this.currentDifficulty;
  }

  public getBestScore(puzzleId: string): number | null {
    try {
      const stored = localStorage.getItem(`kiro_puzzle_best_${puzzleId}`);
      if (stored !== null) {
        const val = parseInt(stored, 10);
        return isNaN(val) ? null : val;
      }
    } catch {
      // Ignore storage access error
    }
    return null;
  }

  public saveBestScore(puzzleId: string, score: number): void {
    try {
      const current = this.getBestScore(puzzleId) ?? 0;
      if (score > current) {
        localStorage.setItem(`kiro_puzzle_best_${puzzleId}`, score.toString());
      }
    } catch {
      // Ignore
    }
  }

  public awardGoldMedal(puzzleId: string): void {
    try {
      localStorage.setItem(`kiro_puzzle_gold_${puzzleId}`, 'true');
      EventBus.getInstance().emit('achievement:unlocked', {
        achievementId: `gold_medal_${puzzleId}`
      });
    } catch {
      // Ignore
    }
  }

  public hasGoldMedal(puzzleId: string): boolean {
    try {
      return localStorage.getItem(`kiro_puzzle_gold_${puzzleId}`) === 'true';
    } catch {
      return false;
    }
  }

  /**
   * Aplica el resultado de un reto a la progresión del estudiante.
   */
  public static applyResult(result: PuzzleResult): boolean {
    const progression = ProgressionManager.getInstance();
    let leveledUp = false;

    if (result.xpEarned > 0) {
      leveledUp = progression.addXP(result.xpEarned, false);
    }

    if (result.coinsEarned > 0) {
      progression.addCoins(result.coinsEarned, false);
    }

    if (result.relicUnlocked) {
      const unlocked = progression.unlockRelic(result.relicUnlocked);
      if (!unlocked) {
        progression.saveProgress();
      }
      return leveledUp;
    }

    progression.saveProgress();
    return leveledUp;
  }

  private createDOM(): void {
    if (typeof document === 'undefined') return;

    let wrapper = document.getElementById('puzzle-modal');
    if (!wrapper) {
      wrapper = document.createElement('div');
      wrapper.id = 'puzzle-modal';
      wrapper.className = 'modal hidden';
      wrapper.innerHTML = `
        <div class="modal-content large puzzle-box">
          <div class="puzzle-header">
            <h3 id="puzzle-title">Enigma</h3>
            <div id="puzzle-timer-badge" class="puzzle-timer">00:00</div>
            <button id="btn-close-puzzle" class="btn-icon">✕</button>
          </div>
          <div id="puzzle-body" class="puzzle-interactive-area"></div>
        </div>
      `;
      document.body.appendChild(wrapper);
    }

    this.modalElem = wrapper;
    this.contentElem = wrapper.querySelector('#puzzle-body');
    this.titleElem = wrapper.querySelector('#puzzle-title');

    wrapper.querySelector('#btn-close-puzzle')?.addEventListener('click', () => {
      this.close();
    });
  }

  /**
   * Valida la estructura alterna de un HybridChallenge:
   * Requiere mínimo 2 fases mecánicas y 2 fases de quiz, alternando de tipo.
   */
  public validateHybridChallengePhases(phases: PuzzlePhase[]): boolean {
    if (!phases || phases.length < 4) return false;

    let mechanicalCount = 0;
    let quizCount = 0;

    for (let i = 0; i < phases.length; i++) {
      const phase = phases[i];
      if (phase.type === 'mechanical') mechanicalCount++;
      else if (phase.type === 'quiz') quizCount++;

      if (i > 0 && phase.type === phases[i - 1].type) {
        return false; // Debe alternar
      }
    }

    return mechanicalCount >= 2 && quizCount >= 2;
  }

  /**
   * Lanza un HybridChallenge cumpliendo con todos los requisitos de R4:
   * - Alternancia mecánica y quiz
   * - Cronómetro y penalización de par time (-10% por cada 30s de exceso)
   * - Ráfaga de partículas al acertar
   * - Explicación y penalización de -20 XP al fallar sin terminar
   * - Medalla de oro si la ejecución fue perfecta
   */
  public launchHybridChallenge(challenge: HybridChallenge): void {
    if (!this.validateHybridChallengePhases(challenge.phases)) {
      throw new Error(
        `HybridChallenge ${challenge.id} no cumple la estructura alterna: se requieren al menos 2 fases mecánicas y 2 de quiz alternadas.`
      );
    }

    const adjustedDifficulty = challenge.difficulty || this.currentDifficulty;

    this.currentSession = {
      challengeId: challenge.id,
      phaseIndex: 0,
      startTime: Date.now(),
      phaseStartTime: Date.now(),
      baseScore: 100,
      xpPotential: 100,
      coinPotential: 50,
      wrongAnswersCount: 0,
      isPerfect: true,
      totalTimeElapsed: 0,
      goldMedalAwarded: false
    };

    if (this.titleElem) {
      this.titleElem.textContent = `${challenge.title} [${adjustedDifficulty.toUpperCase()}]`;
    }

    this.open();
    this.renderCurrentPhase(challenge);
  }

  private renderCurrentPhase(challenge: HybridChallenge): void {
    if (!this.currentSession) return;
    if (this.currentSession.phaseIndex >= challenge.phases.length) {
      this.completeHybridChallenge(challenge);
      return;
    }

    const phase = challenge.phases[this.currentSession.phaseIndex];
    this.currentSession.phaseStartTime = Date.now();

    const adaptive = AdaptiveDifficulty.getInstance();
    const effectiveParTime = adaptive.getAdjustedTimer(phase.parTimeSeconds);

    this.startPhaseTimer(effectiveParTime);

    if (phase.type === 'quiz') {
      this.renderQuizPhase(challenge, phase, phase.content as QuizPhaseContent);
    } else {
      this.renderMechanicalPhase(challenge, phase, phase.content as MechanicalPhaseContent);
    }
  }

  private startPhaseTimer(seconds: number): void {
    if (this.activeTimerInterval) {
      clearInterval(this.activeTimerInterval);
    }

    let remaining = seconds;
    const updateDisplay = () => {
      const timerBadge = this.modalElem?.querySelector('#puzzle-timer-badge');
      if (timerBadge) {
        const mins = Math.floor(Math.max(0, remaining) / 60)
          .toString()
          .padStart(2, '0');
        const secs = (Math.max(0, remaining) % 60).toString().padStart(2, '0');
        timerBadge.textContent = `⏱️ ${mins}:${secs}`;
      }
    };

    updateDisplay();
    this.activeTimerInterval = setInterval(() => {
      remaining--;
      updateDisplay();
    }, 1000);
  }

  private renderQuizPhase(
    challenge: HybridChallenge,
    _phase: PuzzlePhase,
    content: QuizPhaseContent
  ): void {
    if (!this.contentElem) return;

    const adaptive = AdaptiveDifficulty.getInstance();
    const showHint = adaptive.shouldShowHint();
    const options = [content.correctAnswer, ...content.distractors].sort(() => 0.5 - Math.random());

    this.contentElem.innerHTML = `
      <div class="hybrid-quiz-phase">
        <div class="phase-indicator">Fase ${this.currentSession!.phaseIndex + 1} de ${challenge.phases.length}: Pregunta Académica (${content.subject})</div>
        <h4 class="quiz-question">${content.question}</h4>
        ${showHint ? `<div class="adaptive-hint-banner">💡 Pista de apoyo: Recuerda los fundamentos de ${content.subject}.</div>` : ''}
        <div class="quiz-options-grid">
          ${options
            .map(
              (opt, idx) => `
            <button class="btn btn-option quiz-opt-btn" data-answer="${opt}">
              <span class="opt-index">${String.fromCharCode(65 + idx)}.</span> ${opt}
            </button>
          `
            )
            .join('')}
        </div>
        <div id="quiz-feedback-box" class="quiz-feedback hidden"></div>
      </div>
    `;

    const feedbackBox = this.contentElem.querySelector('#quiz-feedback-box') as HTMLElement;
    const buttons = this.contentElem.querySelectorAll('.quiz-opt-btn');

    buttons.forEach((btn) => {
      btn.addEventListener('click', () => {
        const selected = btn.getAttribute('data-answer');
        const isCorrect = selected === content.correctAnswer;

        if (isCorrect) {
          btn.classList.add('correct');
          this.triggerParticleBurst();
          EventBus.getInstance().emit('puzzle:answered', { correct: true });

          if (feedbackBox) {
            feedbackBox.className = 'quiz-feedback success';
            feedbackBox.innerHTML = `<strong>¡Correcto!</strong> ${content.explanation}`;
          }

          setTimeout(() => {
            if (this.currentSession) {
              this.currentSession.phaseIndex++;
              this.renderCurrentPhase(challenge);
            }
          }, 1000);
        } else {
          btn.classList.add('incorrect');
          if (this.currentSession) {
            this.currentSession.isPerfect = false;
            this.currentSession.wrongAnswersCount++;
            this.currentSession.xpPotential = Math.max(0, this.currentSession.xpPotential - 20);
          }
          EventBus.getInstance().emit('puzzle:answered', { correct: false });

          if (feedbackBox) {
            feedbackBox.className = 'quiz-feedback error';
            feedbackBox.innerHTML = `
              <strong>Respuesta incorrecta (-20 XP).</strong>
              <p>La respuesta correcta es: <em>${content.correctAnswer}</em>.</p>
              <p>${content.explanation}</p>
              <button id="btn-continue-quiz" class="btn btn-secondary btn-sm" style="margin-top:8px;">Continuar</button>
            `;
            feedbackBox.classList.remove('hidden');

            feedbackBox.querySelector('#btn-continue-quiz')?.addEventListener('click', () => {
              if (this.currentSession) {
                this.currentSession.phaseIndex++;
                this.renderCurrentPhase(challenge);
              }
            });
          }
        }
      });
    });
  }

  private renderMechanicalPhase(
    challenge: HybridChallenge,
    _phase: PuzzlePhase,
    content: MechanicalPhaseContent
  ): void {
    if (!this.contentElem) return;

    this.contentElem.innerHTML = `
      <div class="hybrid-mechanical-phase">
        <div class="phase-indicator">Fase ${this.currentSession!.phaseIndex + 1} de ${challenge.phases.length}: Reto Mecánico (${content.mechanic})</div>
        <h4 class="mechanic-title">${content.title || 'Mecanismo en Acción'}</h4>
        <p class="mechanic-desc">${content.description || 'Supera los obstáculos mecánicos para desbloquear el mecanismo.'}</p>
        <div class="mechanic-interactive-canvas">
          <div class="obstacle-track">
            ${Array(content.obstacleCount)
              .fill(0)
              .map((_, i) => `<div class="obstacle-node active" id="mech-node-${i}">⚙️ Nodo ${i + 1}</div>`)
              .join('')}
          </div>
          <button id="btn-solve-mechanic" class="btn btn-success" style="margin-top: 16px;">
            Activar Engranajes y Validar
          </button>
        </div>
      </div>
    `;

    this.contentElem.querySelector('#btn-solve-mechanic')?.addEventListener('click', () => {
      this.triggerParticleBurst();
      if (this.currentSession) {
        this.currentSession.phaseIndex++;
        this.renderCurrentPhase(challenge);
      }
    });
  }

  private completeHybridChallenge(challenge: HybridChallenge): void {
    if (this.activeTimerInterval) {
      clearInterval(this.activeTimerInterval);
      this.activeTimerInterval = null;
    }

    if (!this.currentSession) return;

    const totalElapsedSecs = Math.max(1, Math.round((Date.now() - this.currentSession.startTime) / 1000));
    this.currentSession.totalTimeElapsed = totalElapsedSecs;

    // Reducir la puntuación en un 10% por cada 30 segundos sobre par time
    let score = this.currentSession.baseScore;
    if (totalElapsedSecs > challenge.parTimeSeconds) {
      const overTime = totalElapsedSecs - challenge.parTimeSeconds;
      const penaltyCycles = Math.floor(overTime / 30);
      const penalty = penaltyCycles * 0.1;
      score = Math.max(0, Math.round(score * Math.max(0, 1 - penalty)));
    }

    const adaptive = AdaptiveDifficulty.getInstance();
    const xpMultiplier = adaptive.getXpMultiplier();
    const finalXP = Math.round(this.currentSession.xpPotential * xpMultiplier);
    const finalCoins = this.currentSession.coinPotential;

    const isPerfect = this.currentSession.isPerfect && this.currentSession.wrongAnswersCount === 0;

    if (isPerfect) {
      this.awardGoldMedal(challenge.id);
      this.currentSession.goldMedalAwarded = true;
    }

    this.saveBestScore(challenge.id, score);

    PuzzleEngine.applyResult({
      solved: true,
      xpEarned: finalXP,
      coinsEarned: finalCoins,
      relicUnlocked: challenge.relicRewardId,
      isPerfect
    });

    EventBus.getInstance().emit('puzzle:completed', {
      puzzleId: challenge.id,
      score,
      perfect: isPerfect
    });

    if (this.contentElem) {
      this.contentElem.innerHTML = `
        <div class="puzzle-victory-card">
          <h4>🎉 ¡Desafío Híbrido Superado con Éxito!</h4>
          <p>Puntuación Final: <strong>${score} puntos</strong> (Tiempo: ${totalElapsedSecs}s / Par: ${challenge.parTimeSeconds}s)</p>
          <p>Recompensas: <strong>+${finalXP} XP</strong> y <strong>+${finalCoins} Monedas 🪙</strong></p>
          ${
            isPerfect
              ? `<div class="gold-medal-banner">🥇 <strong>¡Medalla de Oro Obtenida!</strong> Ejecución impecable sin fallos.</div>`
              : ''
          }
          <button id="btn-finish-hybrid" class="btn btn-success" style="margin-top: 14px;">Volver al IES</button>
        </div>
      `;

      this.contentElem.querySelector('#btn-finish-hybrid')?.addEventListener('click', () => {
        this.close();
      });
    }
  }

  public triggerParticleBurst(): void {
    if (typeof document === 'undefined') return;

    const burstContainer = document.createElement('div');
    burstContainer.className = 'puzzle-particle-burst';
    burstContainer.style.position = 'fixed';
    burstContainer.style.left = '50%';
    burstContainer.style.top = '50%';
    burstContainer.style.transform = 'translate(-50%, -50%)';
    burstContainer.style.pointerEvents = 'none';
    burstContainer.style.zIndex = '9999';

    for (let i = 0; i < 16; i++) {
      const particle = document.createElement('span');
      particle.textContent = ['✨', '⭐', '🌟', '💥'][i % 4];
      particle.style.position = 'absolute';
      const angle = (i / 16) * 2 * Math.PI;
      const dist = 50 + Math.random() * 60;
      particle.style.transform = `translate(${Math.cos(angle) * dist}px, ${Math.sin(angle) * dist}px)`;
      particle.style.transition = 'all 0.6s ease-out';
      particle.style.opacity = '1';
      burstContainer.appendChild(particle);
    }

    document.body.appendChild(burstContainer);
    setTimeout(() => {
      burstContainer.remove();
    }, 700);
  }

  /**
   * Puzzle 1: La Balanza Algebraica (Equilibrio de Ecuaciones)
   */
  public launchAlgebraBalance(): void {
    if (!this.modalElem || !this.contentElem || !this.titleElem) return;
    this.titleElem.textContent = '⚖️ La Balanza Algebraica de Don Manuel';

    let leftX = 2;
    let leftUnits = 6;
    let rightUnits = 14;
    const targetX = 4;

    const render = () => {
      if (!this.contentElem) return;
      const totalLeft = leftX * targetX + leftUnits;
      const totalRight = rightUnits;
      const isBalanced = totalLeft === totalRight;
      const isSolved = leftX === 1 && leftUnits === 0 && rightUnits === targetX;

      this.contentElem.innerHTML = `
        <div class="balance-puzzle">
          <p class="puzzle-desc">
            Equilibra la balanza para resolver la ecuación. Lo que hagas en un plato, ¡debes hacerlo en el otro!
          </p>
          <div class="algebra-equation-box">
            <span>${leftX}x + ${leftUnits} = ${rightUnits}</span>
          </div>

          <div class="balance-visual ${isBalanced ? 'balanced' : totalLeft > totalRight ? 'tilt-left' : 'tilt-right'}">
            <div class="balance-fulcrum">▲</div>
            <div class="balance-beam"></div>

            <div class="balance-pan left-pan">
              <div class="pan-label">Plato Izquierdo</div>
              <div class="pan-items">
                ${Array(leftX).fill('<div class="x-box">x</div>').join('')}
                ${leftUnits > 0 ? `<div class="unit-box">+${leftUnits}</div>` : ''}
              </div>
            </div>

            <div class="balance-pan right-pan">
              <div class="pan-label">Plato Derecho</div>
              <div class="pan-items">
                <div class="unit-box number-box">${rightUnits}</div>
              </div>
            </div>
          </div>

          <div class="balance-actions">
            <button id="btn-sub-2" class="btn btn-option" ${leftUnits < 2 || rightUnits < 2 ? 'disabled' : ''}>Restar 2 a ambos lados (-2)</button>
            <button id="btn-sub-6" class="btn btn-option" ${leftUnits < 6 || rightUnits < 6 ? 'disabled' : ''}>Restar 6 a ambos lados (-6)</button>
            <button id="btn-div-2" class="btn btn-option" ${leftX !== 2 || leftUnits !== 0 || rightUnits % 2 !== 0 ? 'disabled' : ''}>Dividir entre 2 (÷2)</button>
            <button id="btn-reset-balance" class="btn btn-secondary">Reiniciar</button>
          </div>

          <div id="balance-result-zone">
            ${
              isSolved
                ? `
              <div class="puzzle-victory-card">
                <h4>🎉 ¡Ecuación Resuelta con Éxito!</h4>
                <p>Has aislado la incógnita: <strong>x = ${targetX}</strong></p>
                <p>Recompensa: <strong>+80 Puntos de Estudio</strong> y <strong>+60 Monedas 🪙</strong></p>
                <button id="btn-claim-balance" class="btn btn-success">Reclamar y Guardar</button>
              </div>
            `
                : ''
            }
          </div>
        </div>
      `;

      this.contentElem.querySelector('#btn-sub-2')?.addEventListener('click', () => {
        leftUnits -= 2;
        rightUnits -= 2;
        render();
      });

      this.contentElem.querySelector('#btn-sub-6')?.addEventListener('click', () => {
        leftUnits -= 6;
        rightUnits -= 6;
        render();
      });

      this.contentElem.querySelector('#btn-div-2')?.addEventListener('click', () => {
        leftX = 1;
        rightUnits /= 2;
        render();
      });

      this.contentElem.querySelector('#btn-reset-balance')?.addEventListener('click', () => {
        leftX = 2;
        leftUnits = 6;
        rightUnits = 14;
        render();
      });

      this.contentElem.querySelector('#btn-claim-balance')?.addEventListener('click', () => {
        PuzzleEngine.applyResult({
          solved: true,
          xpEarned: 80,
          coinsEarned: 60,
          relicUnlocked: 'relic_balance_master'
        });
        this.saveBestScore('puzzle_algebra_balance', 100);
        this.awardGoldMedal('puzzle_algebra_balance');
        this.close();
      });
    };

    render();
    this.open();
  }

  /**
   * Puzzle 2: El Enigma Criptográfico de Miguel de Cervantes (Cifrado César)
   */
  public launchCervantesCipher(): void {
    if (!this.modalElem || !this.contentElem || !this.titleElem) return;
    this.titleElem.textContent = '📜 El Enigma Criptográfico de Cervantes';

    let currentShift = 0;
    const targetShift = 3;
    const originalText = 'EL QUE LEE MUCHO Y ANDA MUCHO, SABE MUCHO';
    const encrypted = caesarCipher(originalText, targetShift);

    const render = () => {
      if (!this.contentElem) return;
      const decodedAttempt = caesarCipher(encrypted, -currentShift);
      const isSolved = currentShift === targetShift;

      this.contentElem.innerHTML = `
        <div class="cervantes-puzzle">
          <p class="puzzle-desc">
            Don Miguel de Cervantes ha dejado este manuscrito cifrado con un desplazamiento de letras.
            Gira la rueda de descifrado hasta encontrar el texto legible original.
          </p>

          <div class="parchment-box">
            <span class="parchment-label">Manuscrito en la Biblioteca:</span>
            <div class="cipher-text">${decodedAttempt}</div>
          </div>

          <div class="cipher-controls">
            <span class="shift-label">Desplazamiento César actual: <strong>${currentShift} posiciones</strong></span>
            <div class="button-group" style="max-width: 320px; margin: 12px auto;">
              <button id="btn-shift-prev" class="btn btn-option">◀ Letra Anterior</button>
              <button id="btn-shift-next" class="btn btn-option">Letra Siguiente ▶</button>
            </div>
          </div>

          <div id="cervantes-result-zone">
            ${
              isSolved
                ? `
              <div class="puzzle-victory-card">
                <h4>🏆 ¡Códice Descifrado con Maestría!</h4>
                <p><em>"${originalText}"</em> — Don Quijote de la Mancha</p>
                <p>Has desbloqueado el <strong>Pergamino Dorado de Cervantes</strong>.</p>
                <button id="btn-claim-cervantes" class="btn btn-success">Aceptar Premio</button>
              </div>
            `
                : ''
            }
          </div>
        </div>
      `;

      this.contentElem.querySelector('#btn-shift-prev')?.addEventListener('click', () => {
        currentShift = (currentShift - 1 + 26) % 26;
        render();
      });

      this.contentElem.querySelector('#btn-shift-next')?.addEventListener('click', () => {
        currentShift = (currentShift + 1) % 26;
        render();
      });

      this.contentElem.querySelector('#btn-claim-cervantes')?.addEventListener('click', () => {
        PuzzleEngine.applyResult({
          solved: true,
          xpEarned: 100,
          coinsEarned: 75,
          relicUnlocked: 'relic_cervantes_scroll'
        });
        this.saveBestScore('puzzle_cervantes_cipher', 100);
        this.awardGoldMedal('puzzle_cervantes_cipher');
        this.close();
      });
    };

    render();
    this.open();
  }

  /**
   * Puzzle 3: La Red Neuronal de Santiago Ramón y Cajal
   */
  public launchCajalSynapse(): void {
    if (!this.modalElem || !this.contentElem || !this.titleElem) return;
    this.titleElem.textContent = '🔬 El Microscopio y Sinapsis de Ramón y Cajal';

    const sequence: number[] = [];
    const correctSequence = [1, 2, 3, 4];
    let isSolved = false;

    const render = () => {
      if (!this.contentElem) return;

      this.contentElem.innerHTML = `
        <div class="cajal-puzzle">
          <p class="puzzle-desc">
            Cajal descubrió la individualidad de las neuronas y la dirección del impulso nervioso.
            Conecta los 4 elementos en la dirección biológica correcta del impulso nervioso:
          </p>

          <div class="synapse-circuit">
            <button class="node-btn ${sequence.includes(1) ? 'active' : ''}" data-id="1">1. Dendritas (Receptoras)</button>
            <div class="synapse-arrow">➜</div>
            <button class="node-btn ${sequence.includes(2) ? 'active' : ''}" data-id="2">2. Soma (Cuerpo Celular)</button>
            <div class="synapse-arrow">➜</div>
            <button class="node-btn ${sequence.includes(3) ? 'active' : ''}" data-id="3">3. Axón (Transmisión)</button>
            <div class="synapse-arrow">➜</div>
            <button class="node-btn ${sequence.includes(4) ? 'active' : ''}" data-id="4">4. Botón Sináptico (Neurotransmisores)</button>
          </div>

          <div class="circuit-status">
            <span>Pulsos conectados: <strong>${sequence.length} de 4</strong></span>
            <button id="btn-reset-synapse" class="btn btn-secondary btn-sm" style="margin-left: 14px;">Reiniciar Impulso</button>
          </div>

          <div id="cajal-result-zone">
            ${
              isSolved
                ? `
              <div class="puzzle-victory-card">
                <h4>🌟 ¡Doctrina Neuronal Verificada!</h4>
                <p>Has reconstruido la polarización dinámica de Ramón y Cajal (Premio Nobel 1906).</p>
                <p>Recompensa: <strong>Medalla de Honor Científico</strong>, +120 Puntos y +80 🪙</p>
                <button id="btn-claim-cajal" class="btn btn-success">Recoger Medalla</button>
              </div>
            `
                : ''
            }
          </div>
        </div>
      `;

      this.contentElem.querySelectorAll('.node-btn').forEach((btn) => {
        btn.addEventListener('click', () => {
          const id = parseInt(btn.getAttribute('data-id') || '0', 10);
          if (!sequence.includes(id)) {
            sequence.push(id);
            const isMatchSoFar = sequence.every((val, idx) => val === correctSequence[idx]);
            if (!isMatchSoFar) {
              alert('⚡ ¡Cortocircuito sináptico! El impulso debe viajar desde las dendritas al axón.');
              sequence.length = 0;
            } else if (sequence.length === 4) {
              isSolved = true;
            }
            render();
          }
        });
      });

      this.contentElem.querySelector('#btn-reset-synapse')?.addEventListener('click', () => {
        sequence.length = 0;
        isSolved = false;
        render();
      });

      this.contentElem.querySelector('#btn-claim-cajal')?.addEventListener('click', () => {
        PuzzleEngine.applyResult({
          solved: true,
          xpEarned: 120,
          coinsEarned: 80,
          relicUnlocked: 'relic_cajal_microscope'
        });
        this.saveBestScore('puzzle_cajal_synapse', 100);
        this.awardGoldMedal('puzzle_cajal_synapse');
        this.close();
      });
    };

    render();
    this.open();
  }

  public open(): void {
    if (this.modalElem) this.modalElem.classList.remove('hidden');
  }

  public close(): void {
    if (this.activeTimerInterval) {
      clearInterval(this.activeTimerInterval);
      this.activeTimerInterval = null;
    }
    if (this.modalElem) this.modalElem.classList.add('hidden');
  }
}
