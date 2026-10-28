import { SaveSystem, ProfileSummary, MAX_PROFILES } from './SaveSystem';

export class ProfileSelectScreen {
  private container: HTMLElement | null = null;
  private onProfileSelected: (profileId: string) => void;

  constructor(onProfileSelected: (profileId: string) => void) {
    this.onProfileSelected = onProfileSelected;
  }

  public show(): void {
    if (this.container) {
      this.container.remove();
    }
    this.render();
  }

  public hide(): void {
    if (this.container) {
      this.container.remove();
      this.container = null;
    }
  }

  private render(): void {
    const saveSystem = SaveSystem.getInstance();
    const profiles = saveSystem.listProfiles();
    const canCreate = profiles.length < MAX_PROFILES;

    const overlay = document.createElement('div');
    overlay.id = 'profile-select-screen';
    overlay.className = 'profile-select-overlay';

    overlay.innerHTML = `
      <div class="profile-select-modal">
        <div class="profile-select-header">
          <h2 class="profile-select-title">🎓 Seleccionar Perfil de Estudiante</h2>
          <p class="profile-select-subtitle">Elige tu partida para continuar explorando el IES o crea un nuevo perfil.</p>
        </div>

        <div class="profile-cards-grid" id="profile-cards-container">
          ${profiles.map((p) => this.renderProfileCard(p)).join('')}
          ${
            canCreate
              ? `
            <div class="profile-card new-profile-card" id="btn-create-profile-card">
              <div class="new-profile-icon">➕</div>
              <h3>Crear Nuevo Perfil</h3>
              <p>Espacio disponible (${profiles.length}/${MAX_PROFILES})</p>
            </div>
          `
              : `
            <div class="profile-card new-profile-card disabled" title="Límite máximo de ${MAX_PROFILES} perfiles alcanzado">
              <div class="new-profile-icon">🔒</div>
              <h3>Máximo de Perfiles</h3>
              <p>Elimina uno si deseas comenzar otra partida.</p>
            </div>
          `
          }
        </div>
      </div>
    `;

    document.body.appendChild(overlay);
    this.container = overlay;
    this.attachEvents(profiles);
  }

  private renderProfileCard(p: ProfileSummary): string {
    return `
      <div class="profile-card" data-profile-id="${p.profile.id}">
        <div class="profile-card-header">
          <div class="profile-avatar-badge">🎒</div>
          <div>
            <h3 class="profile-name">${this.escapeHtml(p.profile.displayName)}</h3>
            <span class="profile-rank-tag">${this.escapeHtml(p.rank)}</span>
          </div>
        </div>

        <div class="profile-stats-list">
          <div class="profile-stat-item">
            <span class="stat-icon">⭐</span>
            <span class="stat-label">Experiencia:</span>
            <span class="stat-value">${p.totalXP.toLocaleString()} XP</span>
          </div>
          <div class="profile-stat-item">
            <span class="stat-icon">📜</span>
            <span class="stat-label">Misiones:</span>
            <span class="stat-value">${p.questsCompleted}</span>
          </div>
          <div class="profile-stat-item">
            <span class="stat-icon">⏱️</span>
            <span class="stat-label">Tiempo jugado:</span>
            <span class="stat-value">${p.playtimeLabel}</span>
          </div>
        </div>

        <div class="profile-card-actions">
          <button class="btn-primary btn-play-profile" data-profile-id="${p.profile.id}">Continuar Partida</button>
          <div class="profile-secondary-actions">
            <button class="btn-secondary btn-export-profile" data-profile-id="${p.profile.id}" title="Exportar partida (JSON)">📥 Exportar</button>
            <button class="btn-danger btn-delete-profile" data-profile-id="${p.profile.id}" title="Eliminar perfil">🗑️ Borrar</button>
          </div>
        </div>
      </div>
    `;
  }

  private attachEvents(profiles: ProfileSummary[]): void {
    if (!this.container) return;
    const saveSystem = SaveSystem.getInstance();

    // Select profile
    this.container.querySelectorAll('.btn-play-profile').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const id = (e.currentTarget as HTMLElement).dataset.profileId;
        if (id) {
          saveSystem.setActiveProfileId(id);
          this.hide();
          this.onProfileSelected(id);
        }
      });
    });

    // Export profile
    this.container.querySelectorAll('.btn-export-profile').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const id = (e.currentTarget as HTMLElement).dataset.profileId;
        if (id) {
          saveSystem.exportProfile(id);
        }
      });
    });

    // Delete profile with confirmation
    this.container.querySelectorAll('.btn-delete-profile').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const id = (e.currentTarget as HTMLElement).dataset.profileId;
        if (!id) return;

        const target = profiles.find((p) => p.profile.id === id);
        const name = target ? target.profile.displayName : 'este perfil';

        const confirmed = window.confirm(`¿Seguro que deseas eliminar definitivamente a ${name}? Se perderá todo el progreso.`);
        if (confirmed) {
          saveSystem.deleteProfile(id);
          this.render();
        }
      });
    });

    // Create profile
    const createBtn = this.container.querySelector('#btn-create-profile-card:not(.disabled)');
    if (createBtn) {
      createBtn.addEventListener('click', () => {
        const name = window.prompt('Introduce el nombre del nuevo estudiante:');
        if (name && name.trim()) {
          const profile = saveSystem.createProfile(name.trim());
          saveSystem.setActiveProfileId(profile.id);
          this.hide();
          this.onProfileSelected(profile.id);
        }
      });
    }
  }

  private escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}
