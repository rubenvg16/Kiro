export interface MovementVector {
  x: number; // -1 (izq) a 1 (der)
  y: number; // -1 (abajo) a 1 (arriba)
  isMoving: boolean;
  isSprinting: boolean;
  /** TRUE sólo en el frame en el que se pulsa el salto (flanco de subida). */
  jumpPressed: boolean;
  /** TRUE mientras el botón o la tecla de salto se mantienen pulsados. */
  jumpHeld: boolean;
}

export class InputManager {
  private keys: Record<string, boolean> = {};
  private joystickVector: { x: number; y: number } = { x: 0, y: 0 };
  private isTouchActive: boolean = false;
  private touchJump: boolean = false;
  private touchSprint: boolean = false;
  /** Estado del salto en el frame anterior (para detectar el flanco). */
  private previousJumpHeld: boolean = false;

  constructor() {
    this.setupKeyboard();
    this.setupVirtualJoystick();
    this.setupTouchButtons();
  }

  private setupKeyboard(): void {
    window.addEventListener('keydown', (e) => {
      this.keys[e.key.toLowerCase()] = true;
    });

    window.addEventListener('keyup', (e) => {
      this.keys[e.key.toLowerCase()] = false;
    });
  }

  private setupVirtualJoystick(): void {
    const joystickZone = document.getElementById('joystick-zone');
    const joystickKnob = document.getElementById('joystick-knob');
    if (!joystickZone || !joystickKnob) return;

    let touchId: number | null = null;
    let startX = 0;
    let startY = 0;
    const maxRadius = 45;

    const onTouchStart = (e: TouchEvent) => {
      if (this.isTouchActive) return;
      const touch = e.changedTouches[0];
      touchId = touch.identifier;
      this.isTouchActive = true;
      startX = touch.clientX;
      startY = touch.clientY;
      joystickZone.classList.add('active');
    };

    const onTouchMove = (e: TouchEvent) => {
      if (!this.isTouchActive) return;
      // Mientras se arrastra el joystick virtual la página no debe desplazarse
      if (e.cancelable) e.preventDefault();
      for (let i = 0; i < e.changedTouches.length; i++) {
        const touch = e.changedTouches[i];
        if (touch.identifier === touchId) {
          const dx = touch.clientX - startX;
          const dy = touch.clientY - startY;
          const distance = Math.hypot(dx, dy);
          const angle = Math.atan2(dy, dx);

          const clampedDist = Math.min(distance, maxRadius);
          const knobX = Math.cos(angle) * clampedDist;
          const knobY = Math.sin(angle) * clampedDist;

          joystickKnob.style.transform = `translate(${knobX}px, ${knobY}px)`;

          this.joystickVector.x = knobX / maxRadius;
          this.joystickVector.y = -(knobY / maxRadius);
          break;
        }
      }
    };

    const onTouchEnd = (e: TouchEvent) => {
      for (let i = 0; i < e.changedTouches.length; i++) {
        if (e.changedTouches[i].identifier === touchId) {
          this.isTouchActive = false;
          touchId = null;
          this.joystickVector.x = 0;
          this.joystickVector.y = 0;
          joystickKnob.style.transform = `translate(0px, 0px)`;
          joystickZone.classList.remove('active');
          break;
        }
      }
    };

    joystickZone.addEventListener('touchstart', onTouchStart, { passive: false });
    window.addEventListener('touchmove', onTouchMove, { passive: false });
    window.addEventListener('touchend', onTouchEnd);
    window.addEventListener('touchcancel', onTouchEnd);
  }

  private setupTouchButtons(): void {
    const jumpBtn = document.getElementById('btn-touch-jump');
    if (jumpBtn) {
      jumpBtn.addEventListener('touchstart', (e) => {
        e.preventDefault();
        this.touchJump = true;
      });
      jumpBtn.addEventListener('touchend', () => {
        this.touchJump = false;
      });
      jumpBtn.addEventListener('touchcancel', () => {
        this.touchJump = false;
      });
    }

    const sprintBtn = document.getElementById('btn-touch-sprint');
    if (sprintBtn) {
      sprintBtn.addEventListener('touchstart', (e) => {
        e.preventDefault();
        this.touchSprint = !this.touchSprint; // Toggle sprint en táctil
        sprintBtn.classList.toggle('active', this.touchSprint);
      });
    }
  }

  public getMovement(): MovementVector {
    let x = 0;
    let y = 0;

    if (this.keys['w'] || this.keys['arrowup']) y += 1;
    if (this.keys['s'] || this.keys['arrowdown']) y -= 1;
    if (this.keys['a'] || this.keys['arrowleft']) x -= 1;
    if (this.keys['d'] || this.keys['arrowright']) x += 1;

    if (this.isTouchActive) {
      x += this.joystickVector.x;
      y += this.joystickVector.y;
    }

    const len = Math.hypot(x, y);
    if (len > 1) {
      x /= len;
      y /= len;
    }

    const isSprinting = Boolean(this.keys['shift'] || this.touchSprint);

    // Salto por flanco: jumpPressed sólo es TRUE en el frame en el que se pulsa
    // la tecla o el botón, de modo que mantener pulsado no encadena saltos.
    const jumpHeld = Boolean(this.keys[' '] || this.touchJump);
    const jumpPressed = jumpHeld && !this.previousJumpHeld;
    this.previousJumpHeld = jumpHeld;

    return {
      x,
      y,
      isMoving: len > 0.05,
      isSprinting,
      jumpPressed,
      jumpHeld,
    };
  }
}
