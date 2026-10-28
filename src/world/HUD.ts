import { EventBus } from '../core/EventBus';
import type { DayPhase, ZoneId } from '../core/EventBus';
import { ProgressionManager } from '../gamification/ProgressionManager';
import { VignetteEffect } from './VignetteEffect';

/**
 * Gestor del HUD extendido: minimapa, fase día/noche, puntos de habilidad,
 * alertas de viñeta roja y barra de progreso.
 * Tarea 16 / Requisitos R1, R5, R9, R15.
 */
export class HUD {
  private static instance: HUD | null = null;
  private skillPointsBadge: HTMLElement | null = null;
  private dayPhaseIcon: HTMLElement | null = null;
  private exploredZonesList: HTMLElement | null = null;
  private progressBar: HTMLElement | null = null;
  private exploredZones: Set<string> = new Set(['patio_central']);

  private constructor() {
    this.createDOM();
    this.setupListeners();
  }

  public static getInstance(): HUD {
    if (!HUD.instance) {
      HUD.instance = new HUD();
    }
    return HUD.instance;
  }

  private createDOM(): void {
    if (document.getElementById('hud-extended-overlay')) {
      return;
    }

    const hudOverlay = document.createElement('div');
    hudOverlay.id = 'hud-extended-overlay';
    hudOverlay.className = 'hud-extended-container';

    hudOverlay.innerHTML = `
      <!-- Minimapa y Zonas Exploradas -->
      <div id="hud-minimap-card" class="hud-minimap-card">
        <div class="hud-minimap-header">
          <span class="minimap-icon">🗺️</span>
          <span class="minimap-title">Mapa Escolar</span>
          <span id="hud-dayphase-badge" class="dayphase-badge" title="Fase Solar">☀️ Mañana</span>
        </div>
        <div id="hud-explored-zones" class="explored-zones-tag-list">
          <span class="zone-tag active">Patio Central</span>
        </div>
      </div>

      <!-- Badge de Puntos de Habilidad disponibles -->
      <div id="hud-skill-points-card" class="hud-skill-points-card">
        <span class="sp-icon">✨</span>
        <span id="hud-sp-count" class="sp-count">0 SP</span>
      </div>

      <!-- Barra de progreso/transición -->
      <div id="hud-transition-progress" class="hud-transition-progress hidden">
        <div class="progress-bar-track">
          <div id="hud-transition-fill" class="progress-bar-fill" style="width: 0%;"></div>
        </div>
      </div>
    `;

    document.body.appendChild(hudOverlay);

    this.skillPointsBadge = document.getElementById('hud-sp-count');
    this.dayPhaseIcon = document.getElementById('hud-dayphase-badge');
    this.exploredZonesList = document.getElementById('hud-explored-zones');
    this.progressBar = document.getElementById('hud-transition-progress');
  }

  private setupListeners(): void {
    const bus = EventBus.getInstance();

    bus.on('daycycle:phaseChanged', ({ phase }) => {
      this.updateDayPhase(phase);
    });

    bus.on('zone:entered', ({ zoneId }) => {
      this.addExploredZone(zoneId);
    });

    bus.on('player:levelup', () => {
      this.updateSkillPoints();
    });

    this.updateSkillPoints();
  }

  public updateDayPhase(phase: DayPhase): void {
    if (!this.dayPhaseIcon) return;
    const icons: Record<DayPhase, string> = {
      morning: '🌅 Mañana',
      afternoon: '☀️ Tarde',
      evening: '🌇 Atardecer',
      night: '🌙 Noche'
    };
    this.dayPhaseIcon.textContent = icons[phase] || '☀️ Día';
  }

  public addExploredZone(zoneId: ZoneId | string): void {
    this.exploredZones.add(zoneId);
    if (!this.exploredZonesList) return;

    this.exploredZonesList.innerHTML = '';
    this.exploredZones.forEach((z) => {
      const tag = document.createElement('span');
      tag.className = 'zone-tag';
      tag.textContent = z.replace(/_/g, ' ');
      this.exploredZonesList?.appendChild(tag);
    });
  }

  public updateSkillPoints(): void {
    if (!this.skillPointsBadge) return;
    try {
      const sp = ProgressionManager.getInstance().getSkillPoints();
      this.skillPointsBadge.textContent = `${sp} SP`;
    } catch {
      this.skillPointsBadge.textContent = '0 SP';
    }
  }

  /**
   * Muestra la barra de carga de transición animada de 0 a 100%.
   */
  public showTransitionProgress(durationMs: number = 1000): Promise<void> {
    return new Promise((resolve) => {
      if (!this.progressBar) {
        resolve();
        return;
      }

      const fill = document.getElementById('hud-transition-fill');
      this.progressBar.classList.remove('hidden');
      if (fill) fill.style.width = '0%';

      const startTime = performance.now();
      const step = (now: number) => {
        const elapsed = now - startTime;
        const pct = Math.min(100, Math.round((elapsed / durationMs) * 100));
        if (fill) fill.style.width = `${pct}%`;

        if (elapsed < durationMs) {
          requestAnimationFrame(step);
        } else {
          setTimeout(() => {
            this.progressBar?.classList.add('hidden');
            resolve();
          }, 150);
        }
      };

      requestAnimationFrame(step);
    });
  }

  /**
   * Comprueba si el tiempo de un reto está por debajo de 10s para encender la viñeta roja.
   */
  public checkCountdownWarning(remainingSeconds: number): void {
    const vignette = VignetteEffect.getInstance();
    if (remainingSeconds > 0 && remainingSeconds <= 10) {
      vignette.setWarningActive(true);
    } else {
      vignette.setWarningActive(false);
    }
  }
}
