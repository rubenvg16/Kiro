import * as THREE from 'three';
import { AvatarModel } from '../avatar/AvatarModel';
import { MovementVector } from './InputManager';

export class PlayerController {
  public avatar: AvatarModel;
  public position: THREE.Vector3 = new THREE.Vector3(0, 0, 0);

  // Físicas y Locomoción
  private walkSpeed: number = 6.2;
  private sprintSpeed: number = 10.5;
  private verticalVelocity: number = 0;
  private gravity: number = -26.0;
  private jumpForce: number = 9.5;
  public isGrounded: boolean = true;

  private targetRotation: number = 0;
  private currentRotation: number = 0;

  constructor(avatar: AvatarModel) {
    this.avatar = avatar;
    this.avatar.group.position.copy(this.position);
  }

  public update(
    delta: number,
    input: MovementVector,
    camera: THREE.PerspectiveCamera
  ): void {
    const isMoving = input.isMoving;
    const isSprinting = input.isSprinting;

    // 1. Físicas de Salto y Gravedad
    if (input.jumpPressed && this.isGrounded) {
      this.verticalVelocity = this.jumpForce;
      this.isGrounded = false;
    }

    if (!this.isGrounded) {
      this.verticalVelocity += this.gravity * delta;
      this.position.y += this.verticalVelocity * delta;

      // Contacto con el suelo del patio
      if (this.position.y <= 0) {
        this.position.y = 0;
        this.verticalVelocity = 0;
        this.isGrounded = true;
      }
    }

    // 2. Movimiento horizontal y rotación
    if (isMoving) {
      this.targetRotation = Math.atan2(input.x, input.y);

      let diff = this.targetRotation - this.currentRotation;
      while (diff < -Math.PI) diff += Math.PI * 2;
      while (diff > Math.PI) diff -= Math.PI * 2;
      this.currentRotation += diff * Math.min(delta * 14, 1);
      this.avatar.group.rotation.y = this.currentRotation;

      const currentSpeed = isSprinting ? this.sprintSpeed : this.walkSpeed;
      const moveDistance = currentSpeed * delta;
      const nextX = this.position.x + Math.sin(this.targetRotation) * moveDistance;
      const nextZ = this.position.z + Math.cos(this.targetRotation) * moveDistance;

      // Comprobación de colisiones con los edificios del instituto
      if (!this.checkBuildingCollision(nextX, this.position.z)) {
        this.position.x = nextX;
      }
      if (!this.checkBuildingCollision(this.position.x, nextZ)) {
        this.position.z = nextZ;
      }

      // Límites del recinto escolar (-36 a 36)
      this.position.x = Math.max(-36, Math.min(36, this.position.x));
      this.position.z = Math.max(-36, Math.min(36, this.position.z));
    }

    // Actualizar coordenadas del modelo 3D
    this.avatar.group.position.copy(this.position);

    // 3. Animaciones dinámicas de andar, correr y saltar
    this.avatar.updateAnimation(delta, isMoving, this.isGrounded, isSprinting);

    // 4. Cámara de seguimiento en 3ª persona
    const cameraHeight = 4.2;
    const cameraDistance = isSprinting ? 8.2 : 7.2; // La cámara se aleja sutilmente al esprintar
    const cameraOffset = new THREE.Vector3(0, cameraHeight, cameraDistance);
    const desiredCameraPos = this.position.clone().add(cameraOffset);
    
    camera.position.lerp(desiredCameraPos, Math.min(delta * 6.0, 1.0));
    camera.lookAt(this.position.x, this.position.y + 1.2, this.position.z);
  }

  /**
   * Evita que el alumno atraviese las paredes del IES y del gimnasio
   */
  private checkBuildingCollision(x: number, z: number): boolean {
    // Edificio Central del IES (Norte, Z = -18)
    if (x >= -14.2 && x <= 14.2 && z >= -24.2 && z <= -11.8) {
      // Dejar paso por la puerta principal
      if (x >= -2.0 && x <= 2.0 && z >= -12.5) {
        return false;
      }
      return true;
    }

    // Gimnasio (Este, X = 20, Z = 8)
    if (x >= 12.8 && x <= 27.2 && z >= -3.2 && z <= 19.2) {
      return true;
    }

    return false;
  }

  public setPosition(x: number, y: number, z: number): void {
    this.position.set(x, y, z);
    this.avatar.group.position.set(x, y, z);
    this.verticalVelocity = 0;
    this.isGrounded = true;
  }
}
