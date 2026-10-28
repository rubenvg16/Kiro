import { EventBus, ZoneId } from '../core/EventBus';
import { AudioManager } from '../audio/AudioManager';
import { ZONE_DEFINITIONS, ZoneDefinition } from './ZoneDefinitions';
import type { SceneManager } from '../core/SceneManager';
import { ProgressionManager } from '../gamification/ProgressionManager';

export class ZoneManager {
  private static instance: ZoneManager | null = null;
  private currentZone: ZoneId = 'patio_central';
  private exploredZones: Set<ZoneId> = new Set(['patio_central']);
  private unlockedZones: Set<ZoneId> = new Set(['patio_central', 'biblioteca', 'pista_deportiva', 'huerto_escolar', 'pasillo_historia']);
  private sceneManager: SceneManager | null = null;

  private constructor() {}

  public static getInstance(): ZoneManager {
    if (!ZoneManager.instance) {
      ZoneManager.instance = new ZoneManager();
    }
    return ZoneManager.instance;
  }

  public static resetInstance(): void {
    ZoneManager.instance = null;
  }

  public registerSceneManager(sm: SceneManager): void {
    this.sceneManager = sm;
  }

  public getCurrentZone(): ZoneId {
    return this.currentZone;
  }

  public getCurrentZoneDefinition(): ZoneDefinition {
    return ZONE_DEFINITIONS[this.currentZone];
  }

  public getExploredZones(): ZoneId[] {
    return Array.from(this.exploredZones);
  }

  public isUnlocked(zoneId: ZoneId): boolean {
    const def = ZONE_DEFINITIONS[zoneId];
    if (!def) return false;
    if (!def.unlockCondition) return true;
    if (this.unlockedZones.has(zoneId)) return true;

    // Evaluate unlock condition
    const cond = def.unlockCondition;
    if (cond.type === 'level') {
      const requiredLevel = parseInt(cond.referenceId, 10);
      const studentLevel = ProgressionManager.getInstance().progress.level;
      if (studentLevel >= requiredLevel) {
        this.unlockZone(zoneId);
        return true;
      }
    } else if (cond.type === 'quest') {
      const completedQuests = ProgressionManager.getInstance().progress.completedQuests;
      if (completedQuests.includes(cond.referenceId)) {
        this.unlockZone(zoneId);
        return true;
      }
    }

    return false;
  }

  public unlockZone(zoneId: ZoneId): void {
    if (!this.unlockedZones.has(zoneId)) {
      this.unlockedZones.add(zoneId);
      const eventBus = EventBus.getInstance();
      eventBus.emit('zone:unlocked', { zoneId });
      AudioManager.getInstance().playSfx('zone_unlock');
    }
  }

  public getUnlockMessage(zoneId: ZoneId): string {
    const def = ZONE_DEFINITIONS[zoneId];
    if (!def || !def.unlockCondition) return 'Zona libre';
    return def.unlockCondition.displayHint || `Se requiere ${def.unlockCondition.type} ${def.unlockCondition.referenceId}`;
  }

  public async transitionTo(zoneId: ZoneId): Promise<boolean> {
    const def = ZONE_DEFINITIONS[zoneId];
    if (!def) return false;

    if (!this.isUnlocked(zoneId)) {
      this.showLockedFeedback(zoneId);
      return false;
    }

    const previousZone = this.currentZone;
    this.currentZone = zoneId;
    const isFirstVisit = !this.exploredZones.has(zoneId);
    this.exploredZones.add(zoneId);

    // Apply lighting & fog
    if (this.sceneManager) {
      this.sceneManager.applyZoneEnvironment(def);
    }

    // Audio transition
    const audio = AudioManager.getInstance();
    if (def.musicTrackId) {
      audio.playMusic(def.musicTrackId, 2);
    }
    if (def.ambientSoundId) {
      audio.playAmbient(def.ambientSoundId);
    }

    // Notify listeners
    EventBus.getInstance().emit('zone:entered', { zoneId });

    // Show title card on first visit
    if (isFirstVisit && previousZone !== zoneId) {
      this.showZoneTitleCard(def);
    }

    return true;
  }

  private showLockedFeedback(zoneId: ZoneId): void {
    const hint = this.getUnlockMessage(zoneId);
    if (typeof document !== 'undefined') {
      const toast = document.createElement('div');
      toast.className = 'pickup-toast';
      toast.style.borderColor = 'var(--error-color, #ef4444)';
      toast.textContent = `🔒 ${hint}`;
      document.body.appendChild(toast);
      setTimeout(() => {
        toast.classList.add('fade-out');
        setTimeout(() => toast.remove(), 400);
      }, 3500);
    }
  }

  private showZoneTitleCard(def: ZoneDefinition): void {
    if (typeof document === 'undefined') return;

    const existing = document.getElementById('zone-title-card');
    if (existing) existing.remove();

    const card = document.createElement('div');
    card.id = 'zone-title-card';
    card.className = 'zone-title-card';
    card.innerHTML = `
      <div class="zone-title-badge">ZONA DESCUBIERTA</div>
      <h2 class="zone-title-name">${def.displayName}</h2>
      <p class="zone-title-desc">${def.description}</p>
    `;

    document.body.appendChild(card);
    setTimeout(() => {
      card.classList.add('fade-out');
      setTimeout(() => card.remove(), 600);
    }, 3000);
  }
}
