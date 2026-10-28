import { EventBus, DayPhase } from '../core/EventBus';

export interface DayNightSnapshot {
  elapsedSecs: number;
  currentPhase: DayPhase;
  normalizedTime: number; // 0 to 1
}

export class DayNightCycle {
  private static instance: DayNightCycle | null = null;
  private elapsed = 0;
  private readonly cycleDuration = 1200; // 20 real minutes (Req 12.1)
  private currentPhase: DayPhase = 'morning';

  private constructor() {
    this.currentPhase = this.calculatePhase(this.getNormalized());
  }

  public static getInstance(): DayNightCycle {
    if (!DayNightCycle.instance) {
      DayNightCycle.instance = new DayNightCycle();
    }
    return DayNightCycle.instance;
  }

  public static resetInstance(): void {
    DayNightCycle.instance = null;
  }

  public getCycleDuration(): number {
    return this.cycleDuration;
  }

  public update(delta: number): void {
    if (delta <= 0 || isNaN(delta)) return;
    this.elapsed += delta;

    const normalized = this.getNormalized();
    const newPhase = this.calculatePhase(normalized);

    if (newPhase !== this.currentPhase) {
      this.currentPhase = newPhase;
      EventBus.getInstance().emit('daycycle:phaseChanged', { phase: newPhase });
    }
  }

  public getPhase(): DayPhase {
    return this.currentPhase;
  }

  /**
   * Returns normalized cycle progress strictly in [0, 1).
   * Feature: complete-game-expansion, Property 9
   */
  public getNormalized(): number {
    const safeElapsed = Math.max(0, this.elapsed);
    const mod = safeElapsed % this.cycleDuration;
    return mod / this.cycleDuration;
  }

  public calculatePhase(normalized: number): DayPhase {
    if (normalized < 0.25) return 'morning';
    if (normalized < 0.5) return 'afternoon';
    if (normalized < 0.75) return 'evening';
    return 'night';
  }

  public serialize(): DayNightSnapshot {
    return {
      elapsedSecs: this.elapsed,
      currentPhase: this.currentPhase,
      normalizedTime: this.getNormalized()
    };
  }

  public hydrate(snap: DayNightSnapshot): void {
    if (!snap || typeof snap.elapsedSecs !== 'number') return;
    this.elapsed = Math.max(0, snap.elapsedSecs);
    this.currentPhase = this.calculatePhase(this.getNormalized());
  }
}
