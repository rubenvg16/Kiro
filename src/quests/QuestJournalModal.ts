import { QuestSystem } from './QuestSystem';
import { Quest } from './QuestDefinitions';

export class QuestJournalModal {
  private static instance: QuestJournalModal | null = null;
  private container: HTMLElement | null = null;
  private isVisible = false;

  private constructor() {}

  public static getInstance(): QuestJournalModal {
    if (!QuestJournalModal.instance) {
      QuestJournalModal.instance = new QuestJournalModal();
    }
    return QuestJournalModal.instance;
  }

  public toggle(): void {
    if (this.isVisible) {
      this.close();
    } else {
      this.open();
    }
  }

  public open(): void {
    if (this.container) {
      this.container.remove();
    }
    this.render();
    this.isVisible = true;
  }

  public close(): void {
    if (this.container) {
      this.container.remove();
      this.container = null;
    }
    this.isVisible = false;
  }

  private render(): void {
    const questSystem = QuestSystem.getInstance();
    const activeQuests = questSystem.getActiveQuests();
    const completedIds = questSystem.getCompletedQuestIds();

    const overlay = document.createElement('div');
    overlay.id = 'quest-journal-modal';
    overlay.className = 'modal-overlay quest-journal-overlay';

    overlay.innerHTML = `
      <div class="modal-content quest-journal-box">
        <div class="quest-journal-header">
          <div class="quest-journal-title-wrap">
            <span class="quest-journal-icon">📜</span>
            <h2>Diario de Misiones del IES</h2>
          </div>
          <button id="btn-close-journal" class="btn-icon">✕</button>
        </div>

        <div class="quest-journal-layout">
          <div class="quest-journal-section">
            <h3 class="section-title">Misiones Activas (${activeQuests.length})</h3>
            <div class="quest-list active-quest-list">
              ${
                activeQuests.length === 0
                  ? '<div class="empty-quests-msg">No tienes misiones activas. ¡Habla con los profesores en el patio!</div>'
                  : activeQuests.map((q) => this.renderActiveQuestCard(q)).join('')
              }
            </div>
          </div>

          <div class="quest-journal-section">
            <h3 class="section-title">Misiones Completadas (${completedIds.length})</h3>
            <div class="quest-list completed-quest-list">
              ${
                completedIds.length === 0
                  ? '<div class="empty-quests-msg">Aún no has completado ninguna misión.</div>'
                  : completedIds.map((id) => this.renderCompletedQuestItem(id)).join('')
              }
            </div>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);
    this.container = overlay;

    const closeBtn = overlay.querySelector('#btn-close-journal');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => this.close());
    }
  }

  private renderActiveQuestCard(q: Quest): string {
    return `
      <div class="quest-card active-card">
        <div class="quest-card-header">
          <h4 class="quest-title">${this.escapeHtml(q.title)}</h4>
          <span class="quest-reward-tag">+${q.rewards.xp} XP</span>
        </div>
        <p class="quest-desc">${this.escapeHtml(q.description)}</p>

        <div class="quest-objectives-checklist">
          ${q.objectives
            .map((obj, i) => {
              const isChecked = obj.completed;
              const isCurrent = !isChecked && (q.objectiveMode === 'parallel' || q.objectives.slice(0, i).every((o) => o.completed));
              const currentClass = isCurrent ? 'current-objective' : '';
              const checkedClass = isChecked ? 'completed-objective' : '';

              return `
                <div class="objective-item ${currentClass} ${checkedClass}">
                  <span class="checkbox-indicator">${isChecked ? '☑' : '☐'}</span>
                  <span class="objective-num">${i + 1}.</span>
                  <span class="objective-label">${this.escapeHtml(obj.description)}</span>
                  ${obj.count ? `<span class="objective-count">(${obj.current || 0}/${obj.count})</span>` : ''}
                </div>
              `;
            })
            .join('')}
        </div>
      </div>
    `;
  }

  private renderCompletedQuestItem(questId: string): string {
    return `
      <div class="quest-card completed-card">
        <div class="completed-check-icon">✓</div>
        <div class="completed-info">
          <span class="completed-id">${this.escapeHtml(questId)}</span>
          <span class="completed-badge">Completada con éxito</span>
        </div>
      </div>
    `;
  }

  private escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}
