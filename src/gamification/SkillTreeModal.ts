import { SkillTree } from './SkillTree';
import { ProgressionManager } from './ProgressionManager';
import { SkillBranch, SKILL_DEFINITIONS } from './SkillDefinitions';

export class SkillTreeModal {
  private static instance: SkillTreeModal | null = null;
  private modalElem: HTMLElement | null = null;
  private selectedBranch: SkillBranch = 'explorador';

  private constructor() {
    this.createDOM();
  }

  public static getInstance(): SkillTreeModal {
    if (!SkillTreeModal.instance) {
      SkillTreeModal.instance = new SkillTreeModal();
    }
    return SkillTreeModal.instance;
  }

  public static resetInstance(): void {
    SkillTreeModal.instance = null;
  }

  private createDOM(): void {
    if (typeof document === 'undefined') return;

    let wrapper = document.getElementById('skill-tree-modal');
    if (!wrapper) {
      wrapper = document.createElement('div');
      wrapper.id = 'skill-tree-modal';
      wrapper.className = 'modal hidden';
      wrapper.innerHTML = `
        <div class="modal-content large skill-tree-box">
          <div class="modal-header">
            <h3>🌳 Árbol de Habilidades del IES</h3>
            <div class="skill-points-badge">
              Puntos Disponibles: <strong id="skill-points-counter">0</strong>
            </div>
            <button id="btn-close-skilltree" class="btn-icon">✕</button>
          </div>
          <div id="skill-tree-error" class="skill-tree-error-banner hidden"></div>
          <div class="branch-tabs" style="display: flex; gap: 10px; margin: 15px 0;">
            <button class="btn btn-tab active" data-branch="explorador">🏃 Explorador</button>
            <button class="btn btn-tab" data-branch="academico">📚 Académico</button>
            <button class="btn btn-tab" data-branch="artesano">🛠️ Artesano</button>
          </div>
          <div id="skill-tree-body" class="skill-tree-grid"></div>
        </div>
      `;
      document.body.appendChild(wrapper);
    }

    this.modalElem = wrapper;

    wrapper.querySelector('#btn-close-skilltree')?.addEventListener('click', () => {
      this.close();
    });

    wrapper.querySelectorAll('.branch-tabs .btn-tab').forEach((tab) => {
      tab.addEventListener('click', () => {
        wrapper.querySelectorAll('.branch-tabs .btn-tab').forEach((t) => t.classList.remove('active'));
        tab.classList.add('active');
        this.selectedBranch = tab.getAttribute('data-branch') as SkillBranch;
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

    const points = ProgressionManager.getInstance().getSkillPoints();
    const pointsCounter = this.modalElem.querySelector('#skill-points-counter');
    if (pointsCounter) pointsCounter.textContent = points.toString();

    const body = this.modalElem.querySelector('#skill-tree-body');
    if (!body) return;

    const skillTree = SkillTree.getInstance();
    const skillsInBranch = SKILL_DEFINITIONS.filter((s) => s.branch === this.selectedBranch);

    // Group by depth
    const depths = [1, 2, 3];
    body.innerHTML = `
      <div class="depth-tiers-container" style="display: flex; flex-direction: column; gap: 20px;">
        ${depths
          .map((d) => {
            const skillsAtDepth = skillsInBranch.filter((s) => s.depth === d);
            return `
            <div class="depth-tier" style="background: rgba(255,255,255,0.03); padding: 12px; border-radius: 8px;">
              <h4 style="margin-bottom: 10px; color: #94a3b8;">Nivel de Maestría ${d}</h4>
              <div class="skills-row" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 12px;">
                ${skillsAtDepth
                  .map((skill) => {
                    const isUnlocked = skillTree.isUnlocked(skill.id);
                    const canBuy = skillTree.canPurchase(skill.id);
                    return `
                    <div class="skill-card ${isUnlocked ? 'unlocked' : canBuy ? 'available' : 'locked'}"
                         style="border: 1px solid ${isUnlocked ? '#10b981' : canBuy ? '#3b82f6' : '#475569'};
                                padding: 14px; border-radius: 8px; background: rgba(0,0,0,0.2);">
                      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                        <strong>${skill.displayName}</strong>
                        <span style="font-size: 0.85rem;">${isUnlocked ? '✅ Desbloqueado' : 'Coste: 1 PT'}</span>
                      </div>
                      <p style="font-size: 0.9rem; color: #cbd5e1; margin-bottom: 12px;">${skill.description}</p>
                      ${
                        isUnlocked
                          ? `<button class="btn btn-secondary btn-sm" disabled style="width: 100%;">Activo</button>`
                          : `<button class="btn btn-primary btn-sm btn-unlock-skill" data-id="${skill.id}" style="width: 100%;">
                              Desbloquear Habilidad
                            </button>`
                      }
                    </div>
                  `;
                  })
                  .join('')}
              </div>
            </div>
          `;
          })
          .join('')}
      </div>
    `;

    body.querySelectorAll('.btn-unlock-skill').forEach((btn) => {
      btn.addEventListener('click', () => {
        const skillId = btn.getAttribute('data-id');
        if (!skillId) return;

        const currentPoints = ProgressionManager.getInstance().getSkillPoints();
        const errorBanner = this.modalElem?.querySelector('#skill-tree-error') as HTMLElement;

        if (currentPoints < 1) {
          if (errorBanner) {
            errorBanner.classList.remove('hidden');
            errorBanner.textContent = '❌ Puntos insuficientes. ¡Sube de nivel para conseguir Puntos de Habilidad!';
          }
          // Highlight skill points counter in HUD
          const hudCounter = document.getElementById('hud-skill-points');
          if (hudCounter) {
            hudCounter.classList.add('highlight-pulse');
            setTimeout(() => hudCounter.classList.remove('highlight-pulse'), 1500);
          }
          return;
        }

        const success = skillTree.purchase(skillId);
        if (success) {
          if (errorBanner) errorBanner.classList.add('hidden');
          this.render();
        } else {
          if (errorBanner) {
            errorBanner.classList.remove('hidden');
            errorBanner.textContent = '❌ Requiere desbloquear al menos una habilidad previa en esta rama.';
          }
        }
      });
    });
  }
}
