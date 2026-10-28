import { AchievementSystem } from './AchievementSystem';
import { ACHIEVEMENT_DEFINITIONS, AchievementCategory } from './AchievementDefinitions';

export class AchievementsModal {
  private static instance: AchievementsModal | null = null;
  private modalElem: HTMLElement | null = null;
  private selectedCategory: AchievementCategory | 'all' = 'all';

  private constructor() {
    this.createDOM();
  }

  public static getInstance(): AchievementsModal {
    if (!AchievementsModal.instance) {
      AchievementsModal.instance = new AchievementsModal();
    }
    return AchievementsModal.instance;
  }

  public static resetInstance(): void {
    AchievementsModal.instance = null;
  }

  private createDOM(): void {
    if (typeof document === 'undefined') return;

    let wrapper = document.getElementById('achievements-modal');
    if (!wrapper) {
      wrapper = document.createElement('div');
      wrapper.id = 'achievements-modal';
      wrapper.className = 'modal hidden';
      wrapper.innerHTML = `
        <div class="modal-content large achievements-box">
          <div class="modal-header">
            <h3>🏆 Vitrina de Logros y Trofeos</h3>
            <button id="btn-close-achievements" class="btn-icon">✕</button>
          </div>
          <div class="achievements-category-tabs" style="display: flex; gap: 8px; margin: 15px 0; overflow-x: auto;">
            <button class="btn btn-tab active" data-cat="all">Todos</button>
            <button class="btn btn-tab" data-cat="exploration">Exploración</button>
            <button class="btn btn-tab" data-cat="academic">Académicos</button>
            <button class="btn btn-tab" data-cat="quest">Misiones</button>
            <button class="btn btn-tab" data-cat="puzzle">Puzzles</button>
            <button class="btn btn-tab" data-cat="social">Social</button>
            <button class="btn btn-tab" data-cat="hidden">Secretos</button>
          </div>
          <div id="achievements-grid" class="achievements-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 12px; max-height: 480px; overflow-y: auto;"></div>
        </div>
      `;
      document.body.appendChild(wrapper);
    }

    this.modalElem = wrapper;

    wrapper.querySelector('#btn-close-achievements')?.addEventListener('click', () => {
      this.close();
    });

    wrapper.querySelectorAll('.achievements-category-tabs .btn-tab').forEach((tab) => {
      tab.addEventListener('click', () => {
        wrapper.querySelectorAll('.achievements-category-tabs .btn-tab').forEach((t) => t.classList.remove('active'));
        tab.classList.add('active');
        this.selectedCategory = tab.getAttribute('data-cat') as any;
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

    const grid = this.modalElem.querySelector('#achievements-grid');
    if (!grid) return;

    const system = AchievementSystem.getInstance();
    const list =
      this.selectedCategory === 'all'
        ? ACHIEVEMENT_DEFINITIONS
        : ACHIEVEMENT_DEFINITIONS.filter((a) => a.category === this.selectedCategory);

    grid.innerHTML = list
      .map((ach) => {
        const isUnlocked = system.isUnlocked(ach.id);
        const progress = system.getProgress(ach.id);
        const isHiddenAndLocked = ach.isHidden && !isUnlocked;

        return `
          <div class="achievement-card ${isUnlocked ? 'unlocked' : 'locked'}"
               style="border: 1px solid ${isUnlocked ? '#f59e0b' : '#334155'};
                      padding: 12px; border-radius: 8px; background: rgba(0,0,0,0.3);
                      display: flex; gap: 12px; align-items: center;">
            <div style="font-size: 2.2rem; filter: ${isUnlocked ? 'none' : 'grayscale(100%) opacity(50%)'};">
              ${isHiddenAndLocked ? '❓' : ach.icon}
            </div>
            <div style="flex: 1;">
              <h4 style="margin: 0 0 4px 0; font-size: 1rem; color: ${isUnlocked ? '#fbbf24' : '#e2e8f0'};">
                ${isHiddenAndLocked ? 'Logro Secreto' : ach.title}
              </h4>
              <p style="margin: 0 0 6px 0; font-size: 0.8rem; color: #94a3b8;">
                ${isHiddenAndLocked ? 'Habla con personajes del instituto para desvelarlo.' : ach.description}
              </p>
              ${
                !isUnlocked && !ach.isHidden
                  ? `
                <div class="progress-bar-container" style="background: #1e293b; height: 6px; border-radius: 3px; overflow: hidden; margin-bottom: 4px;">
                  <div style="background: #3b82f6; width: ${Math.round(progress * 100)}%; height: 100%;"></div>
                </div>
              `
                  : ''
              }
              <div style="display: flex; justify-content: space-between; font-size: 0.75rem;">
                <span style="color: #f59e0b; font-weight: bold;">+${ach.coinReward} 🪙</span>
                <span style="color: ${isUnlocked ? '#10b981' : '#64748b'};">
                  ${isUnlocked ? '✅ Conseguido' : 'Bloqueado'}
                </span>
              </div>
            </div>
          </div>
        `;
      })
      .join('');
  }
}
