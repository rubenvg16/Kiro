import { Leaderboard } from './Leaderboard';

export class LeaderboardModal {
  private static instance: LeaderboardModal | null = null;
  private modalElem: HTMLElement | null = null;
  private selectedMinigameId: string = 'obstacle_race';

  private minigamesList = [
    { id: 'obstacle_race', name: 'Carrera de Obstáculos' },
    { id: 'treasure_hunt', name: 'Búsqueda del Tesoro' },
    { id: 'math_basketball', name: 'Baloncesto Matemático' },
    { id: 'typing_race', name: 'Velocidad de Escritura' },
    { id: 'physics_labyrinth', name: 'Laberinto de Física' },
    { id: 'word_building', name: 'Construcción de Palabras' }
  ];

  private constructor() {
    this.createDOM();
  }

  public static getInstance(): LeaderboardModal {
    if (!LeaderboardModal.instance) {
      LeaderboardModal.instance = new LeaderboardModal();
    }
    return LeaderboardModal.instance;
  }

  public static resetInstance(): void {
    LeaderboardModal.instance = null;
  }

  private createDOM(): void {
    if (typeof document === 'undefined') return;

    let wrapper = document.getElementById('leaderboard-modal');
    if (!wrapper) {
      wrapper = document.createElement('div');
      wrapper.id = 'leaderboard-modal';
      wrapper.className = 'modal hidden';
      wrapper.innerHTML = `
        <div class="modal-content medium leaderboard-box">
          <div class="modal-header">
            <h3>🏅 Tabla de Clasificación Escolar</h3>
            <button id="btn-close-leaderboard" class="btn-icon">✕</button>
          </div>
          <div class="minigame-selector-tabs" style="display: flex; gap: 8px; margin: 15px 0; overflow-x: auto;">
            ${this.minigamesList
              .map(
                (m, idx) => `
              <button class="btn btn-tab ${idx === 0 ? 'active' : ''}" data-id="${m.id}">
                ${m.name}
              </button>
            `
              )
              .join('')}
          </div>
          <div id="leaderboard-table-container"></div>
        </div>
      `;
      document.body.appendChild(wrapper);
    }

    this.modalElem = wrapper;

    wrapper.querySelector('#btn-close-leaderboard')?.addEventListener('click', () => {
      this.close();
    });

    wrapper.querySelectorAll('.minigame-selector-tabs .btn-tab').forEach((tab) => {
      tab.addEventListener('click', () => {
        wrapper.querySelectorAll('.minigame-selector-tabs .btn-tab').forEach((t) => t.classList.remove('active'));
        tab.classList.add('active');
        this.selectedMinigameId = tab.getAttribute('data-id') || 'obstacle_race';
        this.render();
      });
    });
  }

  public open(): void {
    if (!this.modalElem) this.createDOM();
    if (this.modalElem) {
      this.modalElem.classList.remove('hidden');
      this.render();
    }
  }

  public close(): void {
    if (this.modalElem) {
      this.modalElem.classList.add('hidden');
    }
  }

  public render(): void {
    if (!this.modalElem) return;

    const container = this.modalElem.querySelector('#leaderboard-table-container');
    if (!container) return;

    const top10 = Leaderboard.getInstance().getTop10(this.selectedMinigameId);

    if (top10.length === 0) {
      container.innerHTML = `
        <div style="text-align: center; padding: 30px; color: #94a3b8;">
          <p>No hay puntuaciones registradas todavía en este minijuego.</p>
          <p>¡Sé el primero en jugar y coronar el podio!</p>
        </div>
      `;
      return;
    }

    container.innerHTML = `
      <table class="leaderboard-table" style="width: 100%; border-collapse: collapse; margin-top: 10px;">
        <thead>
          <tr style="border-bottom: 2px solid #334155; text-align: left; color: #94a3b8; font-size: 0.9rem;">
            <th style="padding: 10px;">#</th>
            <th style="padding: 10px;">Estudiante</th>
            <th style="padding: 10px;">Puntuación</th>
            <th style="padding: 10px;">Fecha</th>
          </tr>
        </thead>
        <tbody>
          ${top10
            .map((entry, idx) => {
              const medal = idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `${idx + 1}.`;
              const dateStr = new Date(entry.timestamp).toLocaleDateString();
              return `
                <tr style="border-bottom: 1px solid rgba(255,255,255,0.05); background: ${
                  idx % 2 === 0 ? 'rgba(0,0,0,0.1)' : 'transparent'
                };">
                  <td style="padding: 10px; font-weight: bold;">${medal}</td>
                  <td style="padding: 10px;">${entry.playerName}</td>
                  <td style="padding: 10px; font-weight: bold; color: #fbbf24;">${entry.score} pts</td>
                  <td style="padding: 10px; font-size: 0.85rem; color: #94a3b8;">${dateStr}</td>
                </tr>
              `;
            })
            .join('')}
        </tbody>
      </table>
    `;
  }
}
