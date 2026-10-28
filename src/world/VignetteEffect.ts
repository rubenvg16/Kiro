/**
 * Efecto de viñeta roja pulsante en pantalla cuando queda poco tiempo (< 10 segundos).
 * Requisito R15 / Tarea 16.
 */
export class VignetteEffect {
  private static instance: VignetteEffect | null = null;
  private element: HTMLElement | null = null;
  private isPulsing = false;

  private constructor() {
    this.createDOM();
  }

  public static getInstance(): VignetteEffect {
    if (!VignetteEffect.instance) {
      VignetteEffect.instance = new VignetteEffect();
    }
    return VignetteEffect.instance;
  }

  private createDOM(): void {
    if (document.getElementById('screen-vignette-effect')) {
      this.element = document.getElementById('screen-vignette-effect');
      return;
    }

    const overlay = document.createElement('div');
    overlay.id = 'screen-vignette-effect';
    overlay.className = 'vignette-overlay hidden';
    document.body.appendChild(overlay);
    this.element = overlay;
  }

  /**
   * Activa o desactiva la viñeta de peligro/alerta.
   */
  public setWarningActive(active: boolean): void {
    if (!this.element) return;

    if (active && !this.isPulsing) {
      this.isPulsing = true;
      this.element.classList.remove('hidden');
      this.element.classList.add('vignette-pulsing');
    } else if (!active && this.isPulsing) {
      this.isPulsing = false;
      this.element.classList.remove('vignette-pulsing');
      this.element.classList.add('hidden');
    }
  }

  public isWarning(): boolean {
    return this.isPulsing;
  }
}
