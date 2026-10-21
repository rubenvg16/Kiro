import * as THREE from 'three';
import { AvatarModel } from '../avatar/AvatarModel';
import type { MovementVector } from './InputManager';
import { CharacterController, type CharacterInput } from '../core/physics/CharacterController';
import type { PhysicsWorld } from '../core/physics/PhysicsWorld';
import { FollowCamera } from './FollowCamera';

/** Velocidad de giro del avatar hacia la dirección de marcha (1/segundo). */
const TURN_RATE = 14;
/** Suavizado del auto-follow de la cámara (1/segundo). */
const AUTO_FOLLOW_RATE = 2.2;
/** Píxeles que hay que mover para considerar que un arrastre es real. */
const DRAG_THRESHOLD = 4;
/** Cambio de dirección mínimo para considerar que el jugador ha cambiado de rumbo. */
const DIRECTION_EPSILON = 0.15;

/** Amortigua un ángulo por el camino más corto, independiente del framerate. */
function dampAngle(current: number, target: number, rate: number, delta: number): number {
  let diff = target - current;
  while (diff > Math.PI) diff -= Math.PI * 2;
  while (diff < -Math.PI) diff += Math.PI * 2;
  return current + diff * (1 - Math.exp(-rate * delta));
}

/**
 * Controlador del jugador.
 *
 * La simulación (aceleración, fricción, gravedad, coyote time, buffer de salto,
 * escalones y pendientes) vive en `CharacterController`; esta clase sólo
 * traduce la entrada heredada, orienta el avatar y mantiene la cámara de
 * seguimiento.
 */
export class PlayerController {
  /** Modelo 3D del alumno. */
  public avatar: AvatarModel;
  /** Posición de los pies del jugador. */
  public position: THREE.Vector3 = new THREE.Vector3();
  /** TRUE mientras el personaje apoya los pies en el suelo. */
  public isGrounded = false;
  /** Velocidad actual del jugador en m/s. */
  public velocity: THREE.Vector3 = new THREE.Vector3();
  /** Orientación actual de la cámara de seguimiento (radianes). */
  public cameraYaw = 0;

  private readonly world: PhysicsWorld;
  private readonly controller: CharacterController;
  private followCamera: FollowCamera | null = null;
  private cameraInstance: THREE.PerspectiveCamera | null = null;
  private enabled = true;

  // Arrastre del usuario sobre la cámara
  private canvas: HTMLElement | null = null;
  private dragPointerId: number | null = null;
  private dragging = false;
  private dragDistance = 0;
  private lastPointerX = 0;
  private lastPointerY = 0;

  // Intención de marcha: se remuestrea cuando el jugador cambia de dirección
  private intentX = 0;
  private intentZ = 0;
  private intentWorldYaw = 0;
  private hasIntent = false;
  /** Ya se ha muestreado alguna dirección: permite distinguir "nuevo" de "igual". */
  private intentSampled = false;
  /** El usuario ha movido la cámara a mano: el auto-follow espera. */
  private manualCamera = false;

  constructor(avatar: AvatarModel, world: PhysicsWorld, canvas?: HTMLElement) {
    this.avatar = avatar;
    this.world = world;
    this.controller = new CharacterController(world);
    this.controller.setEnabled(this.enabled);

    this.position.copy(this.controller.position);
    this.velocity.copy(this.controller.velocity);
    this.avatar.group.position.copy(this.position);

    if (canvas) {
      this.canvas = canvas;
      this.attachDragHandlers(canvas);
    }
  }

  /**
   * Actualiza la física, el avatar y la cámara.
   *
   * @param delta Segundos transcurridos desde el frame anterior.
   * @param input Entrada heredada del gestor de teclado / joystick.
   * @param camera Cámara de la escena (se inyecta en cada frame).
   */
  public update(
    delta: number,
    input: MovementVector,
    camera: THREE.PerspectiveCamera,
  ): void {
    const dt = Math.min(Math.max(delta, 0), 0.1);
    const followCamera = this.ensureFollowCamera(camera);

    // 1. El arrastre del usuario puede haber girado la cámara en este frame
    this.cameraYaw = followCamera.yaw;

    // 2. Intención de marcha (se remuestrea al cambiar de dirección)
    this.updateIntent(input);

    // 3. Auto-follow: la cámara se va colocando detrás del personaje.
    // Sólo en el suelo: en el aire el yaw se mantiene estable.
    // Se desactiva si el usuario ha girado la cámara a mano.
    if (
      this.enabled &&
      !this.dragging &&
      !this.manualCamera &&
      this.hasIntent &&
      this.isGrounded
    ) {
      const targetYaw = this.intentWorldYaw - Math.PI;
      this.cameraYaw = dampAngle(this.cameraYaw, targetYaw, AUTO_FOLLOW_RATE, dt);
      followCamera.setYaw(this.cameraYaw);
    }

    // 4. Física: la entrada heredada se traduce a la entrada del motor
    const characterInput: CharacterInput = {
      moveX: this.enabled ? input.x : 0,
      moveZ: this.enabled ? input.y : 0,
      yaw: this.cameraYaw,
      jumpPressed: this.enabled && input.jumpPressed,
      jumpHeld: this.enabled && input.jumpHeld,
      sprint: this.enabled && input.isSprinting,
    };
    const state = this.controller.update(dt, characterInput);

    this.position.copy(state.position);
    this.velocity.copy(state.velocity);
    this.isGrounded = state.grounded;

    // 5. Avatar: orientación y animación relativa a la altura real del suelo
    const isMoving = this.enabled && state.speed > 0.1;
    this.updateAvatarFacing(input, dt);
    this.avatar.group.position.copy(this.position);
    this.avatar.updateAnimation(
      dt,
      isMoving,
      state.grounded,
      state.sprinting,
      this.position.y,
    );

    // 6. Cámara de seguimiento (con control de obstrucciones)
    followCamera.followTarget(this.position, dt, this.world);
  }

  /** Teleporta al jugador a una posición concreta y reinicia la cámara. */
  public setPosition(x: number, y: number, z: number): void {
    this.position.set(x, y, z);
    this.controller.teleport(this.position);
    this.velocity.set(0, 0, 0);
    this.isGrounded = this.controller.grounded;

    // La orientación del avatar y de la cámara se reinician (evita yaw residual)
    this.avatar.group.rotation.y = 0;
    this.cameraYaw = 0;
    this.hasIntent = false;
    this.intentSampled = false;
    this.intentX = 0;
    this.intentZ = 0;
    this.manualCamera = false;

    if (this.followCamera) {
      this.followCamera.setYaw(0);
      this.followCamera.snapTo(this.position);
    }
  }

  /** Activa o desactiva el control del jugador (la cámara sigue viva). */
  public setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    this.controller.setEnabled(enabled);
  }

  /** Velocidad horizontal actual en m/s. */
  public getSpeed(): number {
    return Math.sqrt(this.velocity.x * this.velocity.x + this.velocity.z * this.velocity.z);
  }

  /** Orientación actual de la cámara de seguimiento en radianes. */
  public getCameraYaw(): number {
    return this.cameraYaw;
  }

  // ---------------------------------------------------------------------------
  // Interno
  // ---------------------------------------------------------------------------

  /** Crea la cámara de seguimiento si la instancia de cámara ha cambiado. */
  private ensureFollowCamera(camera: THREE.PerspectiveCamera): FollowCamera {
    if (!this.followCamera || this.cameraInstance !== camera) {
      const yaw = this.followCamera ? this.followCamera.yaw : this.cameraYaw;
      this.followCamera = new FollowCamera(camera);
      this.followCamera.setYaw(yaw);
      this.cameraInstance = camera;
    }
    return this.followCamera;
  }

  /**
   * Muestrea la dirección de marcha en el mundo cuando el jugador cambia de
   * dirección. Se hace una sola vez por cambio (no en cada frame) porque la
   * entrada es relativa a la cámara: si se remuestrease cada frame, la cámara
   * y el personaje girarían juntos indefinidamente.
   *
   * Soltar el joystick y volver a pulsarlo en la MISMA dirección NO le quita
   * la cámara al jugador: sólo un cambio real de dirección (o una acción
   * explícita del usuario, como arrastrar el ratón) vuelve a activar el
   * auto-follow.
   */
  private updateIntent(input: MovementVector): void {
    const length = Math.hypot(input.x, input.y);
    if (!this.enabled || length <= 0.05) {
      // Sin movimiento no hay intención, pero la última dirección se
      // conserva para poder compararla con la siguiente pulsación.
      this.hasIntent = false;
      return;
    }

    const dirX = input.x / length;
    const dirZ = input.y / length;
    const changed =
      !this.intentSampled ||
      Math.abs(dirX - this.intentX) > DIRECTION_EPSILON ||
      Math.abs(dirZ - this.intentZ) > DIRECTION_EPSILON;

    if (!changed) {
      // La dirección es la misma que la última vez: el auto-follow sigue
      // esperando y la cámara se queda donde la dejó el jugador.
      this.hasIntent = true;
      return;
    }

    this.intentX = dirX;
    this.intentZ = dirZ;
    this.intentSampled = true;
    this.hasIntent = true;
    this.manualCamera = false;

    // Dirección de marcha en el mundo con el yaw actual de la cámara
    const sin = Math.sin(this.cameraYaw);
    const cos = Math.cos(this.cameraYaw);
    const worldX = cos * dirX - sin * dirZ;
    const worldZ = -sin * dirX - cos * dirZ;
    this.intentWorldYaw = Math.atan2(worldX, worldZ);
  }

  /** Gira el avatar hacia la dirección de marcha (conserva la última si está quieto). */
  private updateAvatarFacing(input: MovementVector, delta: number): void {
    const length = Math.hypot(input.x, input.y);
    if (!this.enabled || length <= 0.05) return;

    const sin = Math.sin(this.cameraYaw);
    const cos = Math.cos(this.cameraYaw);
    const dirX = cos * input.x - sin * input.y;
    const dirZ = -sin * input.x - cos * input.y;

    // El avatar mira hacia +Z en rotación 0, por eso el atan2(dirX, dirZ)
    const targetYaw = Math.atan2(dirX, dirZ);
    this.avatar.group.rotation.y = dampAngle(
      this.avatar.group.rotation.y,
      targetYaw,
      TURN_RATE,
      delta,
    );
  }

  // ---------------------------------------------------------------------------
  // Arrastre de la cámara
  // ---------------------------------------------------------------------------

  private attachDragHandlers(canvas: HTMLElement): void {
    canvas.addEventListener('pointerdown', this.handlePointerDown);
    canvas.addEventListener('pointermove', this.handlePointerMove);
    canvas.addEventListener('pointerup', this.handlePointerUp);
    canvas.addEventListener('pointercancel', this.handlePointerUp);
  }

  private handlePointerDown = (event: PointerEvent): void => {
    // Se ignoran los botones secundarios del ratón
    if (event.pointerType === 'mouse' && event.button !== 0) return;

    this.dragPointerId = event.pointerId;
    this.dragging = false;
    this.dragDistance = 0;
    this.lastPointerX = event.clientX;
    this.lastPointerY = event.clientY;

    if (this.canvas) {
      try {
        this.canvas.setPointerCapture(event.pointerId);
      } catch {
        // Si el puntero ya no está activo se ignora la captura
      }
    }
  };

  private handlePointerMove = (event: PointerEvent): void => {
    if (this.dragPointerId !== event.pointerId) return;

    const dx = event.clientX - this.lastPointerX;
    const dy = event.clientY - this.lastPointerY;
    this.lastPointerX = event.clientX;
    this.lastPointerY = event.clientY;

    this.dragDistance += Math.hypot(dx, dy);
    // Umbral: un clic simple no debe girar la cámara
    if (!this.dragging && this.dragDistance < DRAG_THRESHOLD) return;

    this.dragging = true;
    // El usuario toma el control de la cámara: el auto-follow espera
    this.manualCamera = true;
    this.followCamera?.rotate(dx, dy);
  };

  private handlePointerUp = (event: PointerEvent): void => {
    if (this.dragPointerId !== event.pointerId) return;

    this.dragPointerId = null;
    this.dragging = false;

    if (this.canvas && this.canvas.hasPointerCapture(event.pointerId)) {
      this.canvas.releasePointerCapture(event.pointerId);
    }
  };
}
