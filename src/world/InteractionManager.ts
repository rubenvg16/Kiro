import * as THREE from 'three';
import { PointOfInterest } from './WorldEnvironment';
import { CurriculumService } from '../curriculum/CurriculumService';
import type { QuizQuestion } from '../curriculum/SpanishCurriculumData';
import { PuzzleEngine } from '../puzzles/PuzzleEngine';
import type { PuzzleResult } from '../puzzles/PuzzleEngine';

/** Segundos que hay que esperar para volver a ganar premio en un penalti. */
const PENALTY_COOLDOWN_SECONDS = 60;
/** Segundos que hay que esperar entre dos cuestionarios con premio. */
const QUIZ_COOLDOWN_SECONDS = 30;
/** Reto de mantenimiento del centro (Paco, el conserje). */
const MAINTENANCE_SUBJECT = 'Mantenimiento';
/** Reto literario de Buck, el escudero de Don Quijote (Marcos). */
const BUCK_SUBJECT = 'Buck';

export class InteractionManager {
  private activePOI: PointOfInterest | null = null;
  private bannerElem: HTMLElement | null;
  private badgeElem: HTMLElement | null;
  private titleElem: HTMLElement | null;
  private descElem: HTMLElement | null;
  private modalElem: HTMLElement | null;
  private modalTitle: HTMLElement | null;
  private modalBody: HTMLElement | null;
  private curriculum: CurriculumService;
  /** Preguntas ya premiadas en esta sesión: ya no dan XP ni monedas. */
  private rewardedQuestionIds = new Set<string>();
  /** Marca de tiempo (ms) hasta la que no se puede premiar otro penalti. */
  private penaltyReadyAt = 0;
  /** Marca de tiempo (ms) hasta la que no se puede premiar otro cuestionario. */
  private quizReadyAt = 0;
  /** Limpieza de los escuchadores creados dentro del modal de actividad. */
  private modalCleanup: Array<() => void> = [];

  constructor() {
    this.bannerElem = document.getElementById('poi-banner');
    this.badgeElem = document.getElementById('poi-badge');
    this.titleElem = document.getElementById('poi-title');
    this.descElem = document.getElementById('poi-desc');

    this.modalElem = document.getElementById('activity-modal');
    this.modalTitle = document.getElementById('activity-modal-title');
    this.modalBody = document.getElementById('activity-modal-body');

    this.curriculum = CurriculumService.getInstance();

    this.setupListeners();
  }

  /**
   * El botón de interactuar y la tecla "E" los gestiona `main.ts` (único
   * dueño del despacho: figura histórica > NPC > punto de interés).
   * Aquí sólo se escucha el cierre del modal de actividad.
   */
  private setupListeners(): void {
    const closeBtn = document.getElementById('btn-close-activity');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        this.closeActivityModal();
      });
    }
  }

  // ---------------------------------------------------------------------------
  // Proximidad y cartel
  // ---------------------------------------------------------------------------

  /**
   * Actualiza el punto de interés cercano. Se llama SIEMPRE (cada frame) para
   * que el cartel nunca se quede con datos de un POI que ya no está cerca.
   */
  public checkProximity(playerPosition: THREE.Vector3, pois: PointOfInterest[]): void {
    let nearest: PointOfInterest | null = null;
    let minDist = Infinity;

    for (const poi of pois) {
      const dist = playerPosition.distanceTo(poi.position);
      if (dist <= poi.radius && dist < minDist) {
        minDist = dist;
        nearest = poi;
      }
    }

    this.activePOI = nearest;
  }

  /** Punto de interés sobre el que está el jugador (si lo hay). */
  public getActivePOI(): PointOfInterest | null {
    return this.activePOI;
  }

  /** Escribe el contenido del cartel de interacción. */
  public setBannerContent(badge: string, title: string, description: string): void {
    if (this.badgeElem) this.badgeElem.textContent = badge;
    if (this.titleElem) this.titleElem.textContent = title;
    if (this.descElem) this.descElem.textContent = description;
    if (this.bannerElem) this.bannerElem.classList.remove('hidden');
  }

  /** Oculta el cartel de interacción. */
  public hideBanner(): void {
    if (this.bannerElem) this.bannerElem.classList.add('hidden');
  }

  // ---------------------------------------------------------------------------
  // Modal de actividad
  // ---------------------------------------------------------------------------

  /**
   * Abre el modal de actividad de un punto de interés.
   *
   * @param poi Instalación del centro.
   * @param subject Materia del reto del personaje (opcional). Cuando se indica,
   *   se monta una actividad específica de esa materia en lugar del
   *   cuestionario genérico del aula.
   */
  public openActivityModal(poi: PointOfInterest, subject?: string): void {
    if (!this.modalElem || !this.modalTitle || !this.modalBody) return;

    // Si el modal ya estaba abierto se retiran sus escuchadores: nunca hay
    // botones enlazados dos veces.
    this.runCleanup();

    const currentCourse = this.curriculum.getCourse();

    if (subject) {
      this.openSubjectActivity(poi, subject);
      return;
    }

    this.modalTitle.textContent = `${poi.badge} ${poi.name} — ${currentCourse.name}`;

    if (poi.id === 'conserjeria') {
      this.modalBody.innerHTML = `
        <div class="activity-school">
          <p>🏛️ <strong>Tablón de Anuncios del IES para ${currentCourse.name}:</strong></p>
          <ul style="text-align: left; margin: 15px 20px; line-height: 1.7;">
            <li>⭐ <strong>Retos Voluntarios:</strong> Completar desafíos adicionales otorga monedas para desbloquear ropa y accesorios del avatar.</li>
            <li>📚 <strong>Nivel Curricular Activo:</strong> Estás practicando contenidos oficiales de <strong>${currentCourse.name}</strong> (${currentCourse.stage}).</li>
            <li>📢 <strong>Aviso del Centro:</strong> Puedes cambiar tu curso en cualquier momento desde el selector superior.</li>
          </ul>
        </div>
      `;
    } else if (poi.id === 'pista') {
      this.renderPenaltyChallenge(poi);
    } else {
      // Aula de Informática y Biblioteca: cuestionario curricular del curso activo
      this.renderQuiz(this.curriculum.getQuestions(), poi, currentCourse.name);
    }

    this.modalElem.classList.remove('hidden');
  }

  /** Cierra el modal de actividad y retira los escuchadores creados. */
  public closeActivityModal(): void {
    this.runCleanup();
    if (this.modalBody) this.modalBody.innerHTML = '';
    if (this.modalElem) this.modalElem.classList.add('hidden');
  }

  // ---------------------------------------------------------------------------
  // Actividades por materia
  // ---------------------------------------------------------------------------

  /**
   * Monta la actividad específica de la materia del personaje.
   *
   * - "Matemáticas" -> cuestionario de matemáticas del curso.
   * - "Lengua" / "Buck" -> cuestionario de lengua y literatura.
   * - "Mantenimiento" -> repairing challenge del conserje.
   */
  private openSubjectActivity(poi: PointOfInterest, subject: string): void {
    const currentCourse = this.curriculum.getCourse();

    if (subject === MAINTENANCE_SUBJECT) {
      this.renderMaintenanceChallenge(poi);
      this.modalElem?.classList.remove('hidden');
      return;
    }

    const pool = this.curriculum
      .getQuestions()
      .filter((question) => this.matchesSubject(question.subject, subject));

    if (pool.length === 0) {
      // Sin preguntas de esa materia en el curso activo: se usa el cuestionario
      // general del aula, pero manteniendo el título del personaje.
      this.renderQuiz(this.curriculum.getQuestions(), poi, currentCourse.name, subject);
    } else {
      this.renderQuiz(pool, poi, currentCourse.name, subject);
    }

    this.modalElem?.classList.remove('hidden');
  }

  /** Compara la materia de la pregunta con la del reto del personaje. */
  private matchesSubject(questionSubject: string, challengeSubject: string): boolean {
    const question = questionSubject.toLowerCase();
    const challenge = challengeSubject.toLowerCase();

    if (question.includes(challenge)) return true;
    if (challenge.includes('matemática') && question.includes('matem')) return true;
    if (challenge.includes('lengua') && (question.includes('lengua') || question.includes('letras'))) {
      return true;
    }
    if (challenge.includes('buck') && (question.includes('lengua') || question.includes('letras'))) {
      return true;
    }
    return false;
  }

  /** Título legible de la actividad según la materia del reto. */
  private subjectTitle(poi: PointOfInterest, subject: string): string {
    if (subject === BUCK_SUBJECT) {
      return `${poi.badge} ${poi.name} — El Reto de Buck (Lengua)`;
    }
    return `${poi.badge} ${poi.name} — ${subject}`;
  }

  // ---------------------------------------------------------------------------
  // Cuestionario curricular
  // ---------------------------------------------------------------------------

  /**
   * Monta un cuestionario. Los botones se enlazan de forma síncrona (el
   * `innerHTML` ya existe cuando se enlaza) y se limpian al cerrar el modal,
   * de modo que no se puede enlazar dos veces ni dejar botones muertos.
   */
  private renderQuiz(
    pool: QuizQuestion[],
    poi: PointOfInterest,
    courseName: string,
    subject?: string
  ): void {
    if (!this.modalBody || !this.modalTitle) return;
    if (pool.length === 0) return;

    const currentCourse = this.curriculum.getCourse();
    const randomQ = pool[Math.floor(Math.random() * pool.length)];
    const alreadyRewarded = this.rewardedQuestionIds.has(randomQ.id);
    const cooldownLeft = Math.ceil((this.quizReadyAt - Date.now()) / 1000);

    this.modalTitle.textContent = subject
      ? `${this.subjectTitle(poi, subject)} — ${courseName}`
      : `${poi.badge} ${poi.name} — ${courseName}`;

    this.modalBody.innerHTML = `
      <div class="activity-quiz">
        <span class="subject-badge">${randomQ.subject} — ${currentCourse.name}</span>
        <p class="quiz-question"><strong>Pregunta:</strong> ${randomQ.question}</p>
        <div class="quiz-answers" id="quiz-options-container">
          ${randomQ.options.map((opt, idx) => `
            <button class="btn btn-option quiz-btn" data-idx="${idx}">${opt}</button>
          `).join('')}
        </div>
        <div id="quiz-feedback" class="quiz-feedback-box hidden"></div>
      </div>
    `;

    const btns = Array.from(this.modalBody.querySelectorAll<HTMLButtonElement>('.quiz-btn'));
    const feedback = this.modalBody.querySelector<HTMLElement>('#quiz-feedback');

    btns.forEach((btn) => {
      const handler = () => {
        const selectedIdx = parseInt(btn.dataset.idx || '0', 10);
        btns.forEach(b => { b.disabled = true; });

        const solved = selectedIdx === randomQ.correctIndex;
        let xpEarned = 0;
        let coinsEarned = 0;
        let rewardNote = '';

        if (solved) {
          if (alreadyRewarded) {
            rewardNote = `<p><strong>¡Correcto! (Sin premio: ya habías superado esta pregunta)</strong></p>`;
          } else if (cooldownLeft > 0) {
            rewardNote = `<p><strong>¡Correcto! (Sin premio: espera ${cooldownLeft} s para el siguiente cuestionario)</strong></p>`;
          } else {
            xpEarned = randomQ.points;
            coinsEarned = 20;
            this.rewardedQuestionIds.add(randomQ.id);
            this.quizReadyAt = Date.now() + QUIZ_COOLDOWN_SECONDS * 1000;
            rewardNote = `<p><strong>¡Correcto! (+${xpEarned} Puntos y +${coinsEarned} 🪙)</strong></p>`;
          }

          btn.classList.add('correct');
        } else {
          btn.classList.add('incorrect');
          btns[randomQ.correctIndex]?.classList.add('correct');
          rewardNote = `<p><strong>Casi. La respuesta correcta era: ${randomQ.options[randomQ.correctIndex]}</strong></p>`;
        }

        const result: PuzzleResult = { solved, xpEarned, coinsEarned };
        if (xpEarned > 0 || coinsEarned > 0) {
          PuzzleEngine.applyResult(result);
        }

        if (feedback) {
          feedback.className = `quiz-feedback-box ${solved ? 'success' : 'error'}`;
          feedback.innerHTML = `
            ${rewardNote}
            <p class="explanation">${randomQ.explanation}</p>
          `;
          feedback.classList.remove('hidden');
        }
      };

      btn.addEventListener('click', handler);
      this.modalCleanup.push(() => btn.removeEventListener('click', handler));
    });
  }

  // ---------------------------------------------------------------------------
  // Reto deportivo (penalti) y de mantenimiento
  // ---------------------------------------------------------------------------

  /** Reto del penalti en la pista polideportiva, con enfriamiento de 60 s. */
  private renderPenaltyChallenge(poi: PointOfInterest): void {
    if (!this.modalBody) return;

    const cooldownLeft = Math.ceil((this.penaltyReadyAt - Date.now()) / 1000);
    const ready = cooldownLeft <= 0;

    this.modalBody.innerHTML = `
      <div class="activity-arcade">
        <p>⚽ <strong>Reto Deportivo del Recreo (${poi.name}):</strong></p>
        <p>Prueba tu coordinación en la pista polideportiva del instituto para ganar monedas escolares.</p>
        <div style="margin: 18px 0;">
          <button id="btn-shoot-goal" class="btn btn-success" ${ready ? '' : 'disabled'}>¡Lanzar penalti o triple!</button>
        </div>
        <div id="sport-result" class="sport-result-area"></div>
        ${ready ? '' : `<p class="badge-success-text">⏳ Espera ${cooldownLeft} s para volver a jugar el penalti.</p>`}
      </div>
    `;

    const shootBtn = this.modalBody.querySelector<HTMLButtonElement>('#btn-shoot-goal');
    const resArea = this.modalBody.querySelector<HTMLElement>('#sport-result');

    if (!shootBtn || !resArea) return;

    const handler = () => {
      const left = Math.ceil((this.penaltyReadyAt - Date.now()) / 1000);
      if (left > 0) {
        resArea.innerHTML = `<p class="badge-success-text">⏳ Aún no puedes repetir: quedan ${left} s.</p>`;
        return;
      }

      this.penaltyReadyAt = Date.now() + PENALTY_COOLDOWN_SECONDS * 1000;
      shootBtn.disabled = true;

      const result: PuzzleResult = { solved: true, xpEarned: 30, coinsEarned: 25 };
      PuzzleEngine.applyResult(result);

      resArea.innerHTML = `<p class="badge-success-text">🎉 ¡Golazo por la escuadra! Has ganado <strong>+30 Puntos</strong> y <strong>+25 Monedas 🪙</strong>. Vuelve en ${PENALTY_COOLDOWN_SECONDS} s.</p>`;
    };

    shootBtn.addEventListener('click', handler);
    this.modalCleanup.push(() => shootBtn.removeEventListener('click', handler));
  }

  /** Reto de mantenimiento del centro que propone el conserje. */
  private renderMaintenanceChallenge(poi: PointOfInterest): void {
    if (!this.modalBody || !this.modalTitle) return;

    const cooldownLeft = Math.ceil((this.penaltyReadyAt - Date.now()) / 1000);
    const ready = cooldownLeft <= 0;
    const needed = 3;
    let tightened = 0;

    this.modalTitle.textContent = `${poi.badge} ${poi.name} — Mantenimiento del IES`;

    this.modalBody.innerHTML = `
      <div class="activity-arcade">
        <p>🔧 <strong>Encargo de Paco:</strong> la persiana del aula de arriba se ha quedado atascada.</p>
        <p>Aprieta los <strong>${needed}</strong> tornillos de la persiana para dejarla como nueva.</p>
        <div style="margin: 18px 0;">
          <button id="btn-fix-blind" class="btn btn-success" ${ready ? '' : 'disabled'}>🔩 Apretar tornillo (0/${needed})</button>
        </div>
        <div id="sport-result" class="sport-result-area"></div>
        ${ready ? '' : `<p class="badge-success-text">⏳ Paco está ocupado: vuelve en ${cooldownLeft} s.</p>`}
      </div>
    `;

    const fixBtn = this.modalBody.querySelector<HTMLButtonElement>('#btn-fix-blind');
    const resArea = this.modalBody.querySelector<HTMLElement>('#sport-result');
    if (!fixBtn || !resArea) return;

    const handler = () => {
      const left = Math.ceil((this.penaltyReadyAt - Date.now()) / 1000);
      if (left > 0) {
        resArea.innerHTML = `<p class="badge-success-text">⏳ Paco está ocupado: vuelve en ${left} s.</p>`;
        return;
      }

      tightened += 1;
      fixBtn.textContent = `🔩 Apretar tornillo (${tightened}/${needed})`;

      if (tightened < needed) {
        resArea.innerHTML = `<p class="badge-success-text">🔩 Tornillo ${tightened} de ${needed} apretado.</p>`;
        return;
      }

      this.penaltyReadyAt = Date.now() + PENALTY_COOLDOWN_SECONDS * 1000;
      fixBtn.disabled = true;

      const result: PuzzleResult = { solved: true, xpEarned: 25, coinsEarned: 15 };
      PuzzleEngine.applyResult(result);

      resArea.innerHTML = `<p class="badge-success-text">🎉 ¡Persiana arreglada! Has ganado <strong>+25 Puntos</strong> y <strong>+15 Monedas 🪙</strong>. Vuelve en ${PENALTY_COOLDOWN_SECONDS} s.</p>`;
    };

    fixBtn.addEventListener('click', handler);
    this.modalCleanup.push(() => fixBtn.removeEventListener('click', handler));
  }

  // ---------------------------------------------------------------------------
  // Interno
  // ---------------------------------------------------------------------------

  /** Ejecuta y limpia los escuchadores registrados dentro del modal. */
  private runCleanup(): void {
    const cleanups = this.modalCleanup;
    this.modalCleanup = [];
    cleanups.forEach(cleanup => cleanup());
  }
}
