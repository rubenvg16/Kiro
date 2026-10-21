import * as THREE from 'three';
import { PointOfInterest } from './WorldEnvironment';
import { CurriculumService } from '../curriculum/CurriculumService';
import { ProgressionManager } from '../gamification/ProgressionManager';

export class InteractionManager {
  private activePOI: PointOfInterest | null = null;
  private bannerElem: HTMLElement | null;
  private badgeElem: HTMLElement | null;
  private titleElem: HTMLElement | null;
  private descElem: HTMLElement | null;
  private interactBtn: HTMLButtonElement | null;
  private modalElem: HTMLElement | null;
  private modalTitle: HTMLElement | null;
  private modalBody: HTMLElement | null;
  private curriculum: CurriculumService;
  private progression: ProgressionManager;

  constructor() {
    this.bannerElem = document.getElementById('poi-banner');
    this.badgeElem = document.getElementById('poi-badge');
    this.titleElem = document.getElementById('poi-title');
    this.descElem = document.getElementById('poi-desc');
    this.interactBtn = document.getElementById('btn-interact') as HTMLButtonElement;

    this.modalElem = document.getElementById('activity-modal');
    this.modalTitle = document.getElementById('activity-modal-title');
    this.modalBody = document.getElementById('activity-modal-body');

    this.curriculum = CurriculumService.getInstance();
    this.progression = ProgressionManager.getInstance();

    this.setupListeners();
  }

  private setupListeners(): void {
    if (this.interactBtn) {
      this.interactBtn.addEventListener('click', () => {
        if (this.activePOI) {
          this.openActivityModal(this.activePOI);
        }
      });
    }

    const closeBtn = document.getElementById('btn-close-activity');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        if (this.modalElem) this.modalElem.classList.add('hidden');
      });
    }

    // Tecla 'E' para interactuar
    window.addEventListener('keydown', (e) => {
      if (e.key.toLowerCase() === 'e' && this.activePOI && (!this.modalElem || this.modalElem.classList.contains('hidden'))) {
        this.openActivityModal(this.activePOI);
      }
    });
  }

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

    if (nearest !== this.activePOI) {
      this.activePOI = nearest;
      this.updateBanner();
    }
  }

  private updateBanner(): void {
    if (!this.bannerElem) return;

    if (this.activePOI) {
      if (this.badgeElem) this.badgeElem.textContent = this.activePOI.badge;
      if (this.titleElem) this.titleElem.textContent = this.activePOI.name;
      if (this.descElem) this.descElem.textContent = this.activePOI.description;
      this.bannerElem.classList.remove('hidden');
    } else {
      this.bannerElem.classList.add('hidden');
    }
  }

  private openActivityModal(poi: PointOfInterest): void {
    if (!this.modalElem || !this.modalTitle || !this.modalBody) return;

    const currentCourse = this.curriculum.getCourse();
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
      this.modalBody.innerHTML = `
        <div class="activity-arcade">
          <p>⚽ <strong>Reto Deportivo del Recreo:</strong></p>
          <p>Prueba tu coordinación en la pista polideportiva del instituto para ganar monedas escolares.</p>
          <div style="margin: 18px 0;">
            <button id="btn-shoot-goal" class="btn btn-success">¡Lanzar penalti o triple!</button>
          </div>
          <div id="sport-result" class="sport-result-area"></div>
        </div>
      `;

      setTimeout(() => {
        const shootBtn = document.getElementById('btn-shoot-goal');
        const resArea = document.getElementById('sport-result');
        if (shootBtn && resArea) {
          shootBtn.addEventListener('click', () => {
            this.progression.addXP(30);
            this.progression.addCoins(25);
            resArea.innerHTML = `<p class="badge-success-text">🎉 ¡Golazo por la escuadra! Has ganado <strong>+30 Puntos</strong> y <strong>+25 Monedas 🪙</strong>.</p>`;
          });
        }
      }, 50);
    } else {
      // Aula de Informática y Biblioteca: Cuestionario curricular del curso activo
      const questions = this.curriculum.getQuestions();
      const randomQ = questions[Math.floor(Math.random() * questions.length)];

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

      setTimeout(() => {
        const btns = this.modalBody?.querySelectorAll<HTMLButtonElement>('.quiz-btn');
        const feedback = document.getElementById('quiz-feedback');
        
        btns?.forEach((btn) => {
          btn.addEventListener('click', () => {
            const selectedIdx = parseInt(btn.dataset.idx || '0', 10);
            btns.forEach(b => b.disabled = true);

            if (selectedIdx === randomQ.correctIndex) {
              btn.classList.add('correct');
              this.progression.addXP(randomQ.points);
              this.progression.addCoins(20);

              if (feedback) {
                feedback.className = 'quiz-feedback-box success';
                feedback.innerHTML = `
                  <p><strong>¡Correcto! (+${randomQ.points} Puntos y +20 🪙)</strong></p>
                  <p class="explanation">${randomQ.explanation}</p>
                `;
                feedback.classList.remove('hidden');
              }
            } else {
              btn.classList.add('incorrect');
              btns[randomQ.correctIndex].classList.add('correct');

              if (feedback) {
                feedback.className = 'quiz-feedback-box error';
                feedback.innerHTML = `
                  <p><strong>Casi. La respuesta correcta era: ${randomQ.options[randomQ.correctIndex]}</strong></p>
                  <p class="explanation">${randomQ.explanation}</p>
                `;
                feedback.classList.remove('hidden');
              }
            }
          });
        });
      }, 50);
    }

    this.modalElem.classList.remove('hidden');
  }
}
