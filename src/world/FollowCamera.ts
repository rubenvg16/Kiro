import * as THREE from 'three';
import type { PhysicsWorld } from '../core/physics/PhysicsWorld';

/** Ajustes de la cámara de seguimiento en tercera persona. */
export interface FollowCameraOptions {
  /** Distancia de la cámara al jugador, en metros. */
  distance: number;
  /** Altura de la cámara sobre los pies del jugador, en metros. */
  height: number;
  /** Altura a la que mira la cámara (a la altura del pecho). */
  lookHeight: number;
  /** Distancia mínima cuando un muro corta la visión. */
  minDistance: number;
  /** Suavizado de posición, en 1/segundo. */
  positionLag: number;
  /** Suavizado de orientación, en 1/segundo. */
  rotationLag: number;
  /** Radiánes de giro por píxel de arrastre. */
  yawSensitivity: number;
  /** Límite inferior del pitch (mirando hacia arriba). */
  pitchMin: number;
  /** Límite superior del pitch (mirando hacia abajo). */
  pitchMax: number;
}

const DEFAULT_OPTIONS: FollowCameraOptions = {
  distance: 7.0,
  height: 3.4,
  lookHeight: 1.25,
  minDistance: 2.2,
  positionLag: 8,
  rotationLag: 10,
  yawSensitivity: 0.005,
  pitchMin: -0.35,
  pitchMax: 0.75,
};

/** Altura mínima de la cámara sobre los pies del jugador (evita el suelo). */
const MIN_CAMERA_HEIGHT = 0.5;
/** Margen extra del rayo de obstrucción. */
const OBSTRUCTION_PADDING = 0.4;
/** Separación que se deja respecto al obstáculo detectado. */
const OBSTRUCTION_MARGIN = 0.25;

const EPS = 1e-6;

function clamp(value: number, min: number, max: number): number {
  return value < min ? min : value > max ? max : value;
}

/**
 * Cámara de seguimiento en tercera persona.
 *
 * El yaw sigue la convención del controlador de física: la cámara mira hacia
 * `(-sin(yaw), 0, -cos(yaw))`, por lo que con yaw = 0 mira hacia -Z y se sitúa
 * en `target + (sin(yaw), 0, cos(yaw)) * distance`, es decir, detrás del
 * jugador.
 */
export class FollowCamera {
  /** Orientación horizontal de la cámara, en radianes. */
  public yaw = 0;
  /** Inclinación vertical de la cámara, en radianes. */
  public pitch = 0;

  private readonly camera: THREE.PerspectiveCamera;
  private readonly options: FollowCameraOptions;
  private readonly desiredPosition = new THREE.Vector3();
  private readonly smoothedPosition = new THREE.Vector3();
  private readonly lookTarget = new THREE.Vector3();
  private readonly smoothedLookAt = new THREE.Vector3();
  private readonly toCamera = new THREE.Vector3();
  private readonly currentLookDirection = new THREE.Vector3(0, 0, -1);
  private initialised = false;

  constructor(camera: THREE.PerspectiveCamera, options?: Partial<FollowCameraOptions>) {
    this.camera = camera;
    this.options = { ...DEFAULT_OPTIONS, ...options };
  }

  /** Dirección unitaria hacia la que mira la cámara. */
  public get lookDirection(): THREE.Vector3 {
    return this.currentLookDirection;
  }

  /** Aplica el arrastre del usuario (en píxeles) sobre yaw y pitch. */
  public rotate(dx: number, dy: number): void {
    this.yaw -= dx * this.options.yawSensitivity;
    this.pitch = clamp(
      this.pitch + dy * this.options.yawSensitivity,
      this.options.pitchMin,
      this.options.pitchMax,
    );
  }

  /** Fija la orientación horizontal de la cámara. */
  public setYaw(yaw: number): void {
    this.yaw = yaw;
  }

  /**
   * Sigue al objetivo suavizando la posición con un factor exponencial
   * (independiente de la tasa de fotogramas). Si se pasa `world`, la cámara se
   * acerca cuando hay un obstáculo entre ella y el jugador.
   */
  public followTarget(target: THREE.Vector3, delta: number, world?: PhysicsWorld): void {
    const dt = Math.max(0, delta);
    this.computeDesired(target, world);

    if (!this.initialised) {
      this.smoothedPosition.copy(this.desiredPosition);
      this.smoothedLookAt.copy(this.lookTarget);
      this.initialised = true;
    } else {
      // Suavizado exponencial: independiente de la tasa de fotogramas
      const positionAlpha = 1 - Math.exp(-this.options.positionLag * dt);
      const rotationAlpha = 1 - Math.exp(-this.options.rotationLag * dt);
      this.smoothedPosition.lerp(this.desiredPosition, positionAlpha);
      this.smoothedLookAt.lerp(this.lookTarget, rotationAlpha);
    }

    this.applyToCamera();
  }

  /** Coloca la cámara instantáneamente (cambio de modo o reaparición). */
  public snapTo(target: THREE.Vector3): void {
    this.computeDesired(target);
    this.smoothedPosition.copy(this.desiredPosition);
    this.smoothedLookAt.copy(this.lookTarget);
    this.initialised = true;
    this.applyToCamera();
  }

  /** Calcula la posición deseada y el punto de mira. */
  private computeDesired(target: THREE.Vector3, world?: PhysicsWorld): void {
    // Punto de mira: a la altura del pecho del jugador
    this.lookTarget.set(target.x, target.y + this.options.lookHeight, target.z);

    // Órbita detrás del jugador: el pitch eleva y acerca la cámara
    const horizontalDistance = this.options.distance * Math.cos(this.pitch);
    const verticalOffset = this.options.height + Math.sin(this.pitch) * this.options.distance;
    this.desiredPosition.set(
      target.x + Math.sin(this.yaw) * horizontalDistance,
      target.y + verticalOffset,
      target.z + Math.cos(this.yaw) * horizontalDistance,
    );

    // La cámara nunca debe bajar por debajo del suelo del jugador
    this.desiredPosition.y = Math.max(this.desiredPosition.y, target.y + MIN_CAMERA_HEIGHT);

    if (!world) return;

    // Obstrucciones: si hay un muro entre la cámara y el jugador, se acorta
    this.toCamera.copy(this.desiredPosition).sub(this.lookTarget);
    const distance = this.toCamera.length();
    if (distance < EPS) return;

    this.toCamera.multiplyScalar(1 / distance);
    const hit = world.raycast(this.lookTarget, this.toCamera, distance + OBSTRUCTION_PADDING);
    if (!hit || hit.distance >= distance) return;

    const allowed = Math.max(this.options.minDistance, hit.distance - OBSTRUCTION_MARGIN);
    this.desiredPosition.copy(this.lookTarget).addScaledVector(this.toCamera, allowed);
    this.desiredPosition.y = Math.max(this.desiredPosition.y, target.y + MIN_CAMERA_HEIGHT);
  }

  /** Aplica la posición y la orientación calculadas a la cámara real. */
  private applyToCamera(): void {
    this.camera.position.copy(this.smoothedPosition);
    this.camera.lookAt(this.smoothedLookAt);
    this.currentLookDirection.copy(this.smoothedLookAt).sub(this.smoothedPosition);
    if (this.currentLookDirection.lengthSq() > EPS) {
      this.currentLookDirection.normalize();
    }
  }
}
