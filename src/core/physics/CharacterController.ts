import * as THREE from 'three';
import type { PhysicsWorld } from './PhysicsWorld';
import type { BoxCollider, RigidBody, SphereCollider, StaticCollider } from './types';

/** Per frame input for the character controller. */
export interface CharacterInput {
  /** Strafe axis, -1..1, relative to the camera. */
  moveX: number;
  /** Forward axis, -1..1, relative to the camera. */
  moveZ: number;
  /** Camera yaw in radians (0 means +Z is forward). */
  yaw: number;
  /** True on the frame the jump button was pressed. */
  jumpPressed: boolean;
  /** True while the jump button is held. */
  jumpHeld: boolean;
  /** True while the sprint button is held. */
  sprint: boolean;
}

/** Snapshot of the controller after an update. */
export interface CharacterState {
  /** Position of the feet (the bottom of the capsule). */
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  grounded: boolean;
  groundNormal: THREE.Vector3;
  justLanded: boolean;
  /** Vertical impact speed at the moment of landing, 0 when not landing. */
  landingSpeed: number;
  /** Horizontal speed in m/s. */
  speed: number;
  sprinting: boolean;
}

/** Tuning of the character controller. */
export interface CharacterControllerOptions {
  radius: number;
  height: number;
  walkSpeed: number;
  sprintSpeed: number;
  acceleration: number;
  airAcceleration: number;
  groundFriction: number;
  airDrag: number;
  jumpVelocity: number;
  maxFallSpeed: number;
  coyoteTime: number;
  jumpBufferTime: number;
  stepHeight: number;
  maxSlopeAngleDeg: number;
  groundSnapDistance: number;
}

const DEFAULT_OPTIONS: CharacterControllerOptions = {
  radius: 0.35,
  height: 1.75,
  walkSpeed: 3.4,
  sprintSpeed: 6.2,
  acceleration: 30,
  airAcceleration: 9,
  groundFriction: 16,
  airDrag: 0.4,
  jumpVelocity: 6.4,
  maxFallSpeed: 30,
  coyoteTime: 0.12,
  jumpBufferTime: 0.12,
  stepHeight: 0.45,
  maxSlopeAngleDeg: 52,
  groundSnapDistance: 0.35,
};

const EPS = 1e-8;
/** Distancia (m) a la que un contacto sin penetración sigue siendo "contacto". */
const CONTACT_TOLERANCE = 0.01;
/** Masa efectiva del personaje en los contactos con cuerpos dinámicos (kg). */
const CHARACTER_CONTACT_MASS = 65;
/** Fuerza máxima que el personaje puede ejercer al empujar un cuerpo (N). */
const PUSH_FORCE = 26;
/** Fracción de la velocidad de aproximación que se transfiere al cuerpo empujado. */
const PUSH_SPEED_TRANSFER = 1;
/** Por debajo de esta velocidad de impacto no hay rebote contra el personaje. */
const BOUNCE_THRESHOLD = 1;
/** Velocidad mínima de aproximación para que el personaje empuje un cuerpo. */
const PUSH_MIN_APPROACH = 0.05;

interface CapsuleContact {
  collider: StaticCollider;
  normal: THREE.Vector3;
  penetration: number;
}

/** Contacto entre la cápsula del personaje y un cuerpo dinámico. */
interface DynamicContact {
  /** Normal que apunta del cuerpo hacia el personaje. */
  normal: THREE.Vector3;
  /** Profundidad de la penetración. */
  penetration: number;
}

/** Estado vertical del personaje antes de intentar subir un escalón. */
interface StepUpState {
  y: number;
  velocityY: number;
  grounded: boolean;
  groundNormal: THREE.Vector3;
}

/** Reusable container of contacts. The contact objects are pooled to avoid per-frame allocations. */
interface ContactBuffer {
  items: CapsuleContact[];
  pool: CapsuleContact[];
}

const scratchA = new THREE.Vector3();
const scratchB = new THREE.Vector3();
const scratchC = new THREE.Vector3();
const scratchNormal = new THREE.Vector3();
const scratchDynamic: DynamicContact = { normal: new THREE.Vector3(), penetration: 0 };

function clamp(value: number, min: number, max: number): number {
  return value < min ? min : value > max ? max : value;
}

/** Capsule (vertical) against an axis aligned box. The normal points from the box to the capsule. */
function capsuleBoxContact(
  feet: THREE.Vector3,
  radius: number,
  height: number,
  box: BoxCollider,
  out: CapsuleContact,
): boolean {
  const bottomY = feet.y + radius;
  const topY = feet.y + height - radius;

  const minX = box.center.x - box.half.x;
  const maxX = box.center.x + box.half.x;
  const minY = box.center.y - box.half.y;
  const maxY = box.center.y + box.half.y;
  const minZ = box.center.z - box.half.z;
  const maxZ = box.center.z + box.half.z;

  const px = clamp(feet.x, minX, maxX);
  const pz = clamp(feet.z, minZ, maxZ);
  const dx = feet.x - px;
  const dz = feet.z - pz;
  const horizontalSq = dx * dx + dz * dz;

  const overlapLow = Math.max(bottomY, minY);
  const overlapHigh = Math.min(topY, maxY);

  if (overlapLow < overlapHigh) {
    if (horizontalSq > EPS) {
      const distance = Math.sqrt(horizontalSq);
      if (distance > radius) return false;
      out.normal.set(dx / distance, 0, dz / distance);
      out.penetration = radius - distance;
      return true;
    }

    // The capsule axis sits inside the box footprint: escape through the closest face.
    const up = maxY + radius - bottomY;
    const down = topY - (minY - radius);
    const left = feet.x - (minX - radius);
    const right = maxX + radius - feet.x;
    const back = feet.z - (minZ - radius);
    const front = maxZ + radius - feet.z;

    let best = up;
    let nx = 0;
    let ny = 1;
    let nz = 0;
    if (down < best) {
      best = down;
      nx = 0;
      ny = -1;
      nz = 0;
    }
    if (left < best) {
      best = left;
      nx = -1;
      ny = 0;
      nz = 0;
    }
    if (right < best) {
      best = right;
      nx = 1;
      ny = 0;
      nz = 0;
    }
    if (back < best) {
      best = back;
      nx = 0;
      ny = 0;
      nz = -1;
    }
    if (front < best) {
      best = front;
      nx = 0;
      ny = 0;
      nz = 1;
    }

    out.normal.set(nx, ny, nz);
    out.penetration = best;
    return true;
  }

  // The capsule is entirely above or below the box.
  let boxY: number;
  let segmentY: number;
  if (bottomY > maxY) {
    boxY = maxY;
    segmentY = bottomY;
  } else {
    boxY = minY;
    segmentY = topY;
  }

  const ddx = feet.x - px;
  const ddy = segmentY - boxY;
  const ddz = feet.z - pz;
  const distanceSq = ddx * ddx + ddy * ddy + ddz * ddz;
  if (distanceSq > radius * radius) return false;

  const distance = Math.sqrt(distanceSq);
  if (distance < EPS) {
    out.normal.set(0, 1, 0);
    out.penetration = radius;
    return true;
  }

  out.normal.set(ddx / distance, ddy / distance, ddz / distance);
  out.penetration = radius - distance;
  return true;
}

/** Capsule against a sphere. The normal points from the sphere to the capsule. */
function capsuleSphereContact(
  feet: THREE.Vector3,
  radius: number,
  height: number,
  sphere: SphereCollider,
  out: CapsuleContact,
): boolean {
  const bottomY = feet.y + radius;
  const topY = feet.y + height - radius;
  const closestY = clamp(sphere.center.y, bottomY, topY);

  const dx = feet.x - sphere.center.x;
  const dy = closestY - sphere.center.y;
  const dz = feet.z - sphere.center.z;
  const distanceSq = dx * dx + dy * dy + dz * dz;
  const radii = radius + sphere.radius;
  if (distanceSq > radii * radii) return false;

  const distance = Math.sqrt(distanceSq);
  if (distance < EPS) {
    const up = sphere.center.y + radii - bottomY;
    const down = topY - (sphere.center.y - radii);
    out.normal.set(0, up <= down ? 1 : -1, 0);
    out.penetration = up <= down ? up : down;
    return true;
  }

  out.normal.set(dx / distance, dy / distance, dz / distance);
  out.penetration = radii - distance;
  return true;
}

/**
 * Kinematic capsule character.
 *
 * The controller is not a rigid body: it is moved by the gameplay code and the
 * world geometry pushes it around. It keeps momentum, supports slopes, stairs
 * and variable jump heights, and never tunnels through thin walls.
 */
export class CharacterController {
  /** Position of the feet. */
  public position = new THREE.Vector3();
  /** Current velocity in m/s. */
  public velocity = new THREE.Vector3();
  /** True while the character rests on a walkable surface. */
  public grounded = false;
  /** Normal of the surface the character stands on. */
  public groundNormal = new THREE.Vector3(0, 1, 0);

  private readonly world: PhysicsWorld;
  private readonly options: CharacterControllerOptions;
  private readonly maxSlopeCos: number;
  private enabled = true;
  private sprinting = false;
  private coyoteTimer = 0;
  private jumpBufferTimer = 0;
  private jumpCutApplied = false;
  private jumpedThisFrame = false;
  private pendingLandingSpeed = 0;
  private readonly contactBuffers: ContactBuffer[] = [
    { items: [], pool: [] },
    { items: [], pool: [] },
  ];
  private bufferIndex = 0;
  /** Estado vertical guardado antes de cada intento de subir un escalón. */
  private readonly stepState: StepUpState = {
    y: 0,
    velocityY: 0,
    grounded: false,
    groundNormal: new THREE.Vector3(0, 1, 0),
  };

  constructor(world: PhysicsWorld, options?: Partial<CharacterControllerOptions>) {
    this.world = world;
    this.options = { ...DEFAULT_OPTIONS, ...options };
    this.maxSlopeCos = Math.cos((this.options.maxSlopeAngleDeg * Math.PI) / 180);
  }

  /** Enables or disables the simulation of the character. */
  public setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  /** Moves the character instantly, clearing its velocity. */
  public teleport(position: THREE.Vector3): void {
    this.position.copy(position);
    this.velocity.set(0, 0, 0);
    this.grounded = false;
    this.groundNormal.set(0, 1, 0);
    this.coyoteTimer = 0;
    this.jumpBufferTimer = 0;
    this.jumpCutApplied = false;
  }

  /** Advances the character by `delta` seconds. */
  public update(delta: number, input: CharacterInput): CharacterState {
    if (!this.enabled) {
      return this.buildState(false, 0);
    }

    const dt = clamp(delta, 0, 0.1);
    const wasGrounded = this.grounded;
    this.pendingLandingSpeed = 0;
    this.jumpedThisFrame = false;

    this.updateTimers(dt, input);
    this.updateHorizontalVelocity(dt, input);
    this.updateJump(input);
    this.applyGravity(dt);
    this.integrate(dt);

    // Ground snap: keep contact with the floor when walking down small steps.
    if (!this.grounded && this.velocity.y <= 0) {
      this.snapToGround(wasGrounded);
    }

    const justLanded = !wasGrounded && this.grounded;
    if (justLanded) {
      this.jumpCutApplied = false;
      this.coyoteTimer = this.options.coyoteTime;
    }

    return this.buildState(justLanded, justLanded ? this.pendingLandingSpeed : 0);
  }

  // ---------------------------------------------------------------------------
  // Input handling
  // ---------------------------------------------------------------------------

  private updateTimers(dt: number, input: CharacterInput): void {
    if (input.jumpPressed) this.jumpBufferTimer = this.options.jumpBufferTime;
    else this.jumpBufferTimer = Math.max(0, this.jumpBufferTimer - dt);

    if (this.grounded) this.coyoteTimer = this.options.coyoteTime;
    else this.coyoteTimer = Math.max(0, this.coyoteTimer - dt);
  }

  private updateHorizontalVelocity(dt: number, input: CharacterInput): void {
    const sin = Math.sin(input.yaw);
    const cos = Math.cos(input.yaw);

    // Forward is (-sin(yaw), 0, -cos(yaw)), right is (cos(yaw), 0, -sin(yaw)).
    let dirX = cos * input.moveX - sin * input.moveZ;
    let dirZ = -sin * input.moveX - cos * input.moveZ;

    const inputLength = Math.sqrt(dirX * dirX + dirZ * dirZ);
    const hasInput = inputLength > 1e-4;
    if (hasInput) {
      if (inputLength > 1) {
        dirX /= inputLength;
        dirZ /= inputLength;
      }
    } else {
      dirX = 0;
      dirZ = 0;
    }

    this.sprinting = input.sprint && hasInput;
    const targetSpeed = this.sprinting ? this.options.sprintSpeed : this.options.walkSpeed;

    if (hasInput) {
      const targetX = dirX * targetSpeed;
      const targetZ = dirZ * targetSpeed;
      const deltaX = targetX - this.velocity.x;
      const deltaZ = targetZ - this.velocity.z;
      const deltaLength = Math.sqrt(deltaX * deltaX + deltaZ * deltaZ);
      const acceleration = this.grounded ? this.options.acceleration : this.options.airAcceleration;
      const maxDelta = acceleration * dt;

      if (deltaLength > maxDelta && deltaLength > EPS) {
        const scale = maxDelta / deltaLength;
        this.velocity.x += deltaX * scale;
        this.velocity.z += deltaZ * scale;
      } else {
        this.velocity.x = targetX;
        this.velocity.z = targetZ;
      }
      return;
    }

    if (this.grounded) {
      const speed = Math.sqrt(this.velocity.x * this.velocity.x + this.velocity.z * this.velocity.z);
      if (speed <= EPS) {
        this.velocity.x = 0;
        this.velocity.z = 0;
        return;
      }
      const newSpeed = Math.max(0, speed - this.options.groundFriction * dt);
      const scale = newSpeed / speed;
      this.velocity.x *= scale;
      this.velocity.z *= scale;
      if (newSpeed < 0.02) {
        this.velocity.x = 0;
        this.velocity.z = 0;
      }
      return;
    }

    const drag = Math.max(0, 1 - this.options.airDrag * dt);
    this.velocity.x *= drag;
    this.velocity.z *= drag;
  }

  private updateJump(input: CharacterInput): void {
    if (this.jumpBufferTimer > 0 && this.coyoteTimer > 0) {
      this.velocity.y = this.options.jumpVelocity;
      this.grounded = false;
      this.groundNormal.set(0, 1, 0);
      this.coyoteTimer = 0;
      this.jumpBufferTimer = 0;
      this.jumpCutApplied = false;
      this.jumpedThisFrame = true;
    }

    // Variable jump height: releasing the button cuts the ascent once.
    if (!input.jumpHeld && !this.jumpedThisFrame && !this.jumpCutApplied && this.velocity.y > 0) {
      this.velocity.y *= 0.45;
      this.jumpCutApplied = true;
    }
  }

  private applyGravity(dt: number): void {
    this.velocity.y += this.world.gravity * dt;
    if (this.velocity.y < -this.options.maxFallSpeed) this.velocity.y = -this.options.maxFallSpeed;
  }

  // ---------------------------------------------------------------------------
  // Movement
  // ---------------------------------------------------------------------------

  private integrate(dt: number): void {
    const displacement = Math.sqrt(
      this.velocity.x * this.velocity.x + this.velocity.y * this.velocity.y + this.velocity.z * this.velocity.z,
    ) * dt;

    // Sub-step the movement so fast displacements cannot tunnel through thin
    // walls. The step is a quarter of the capsule radius and the sub-step
    // budget is generous, so the whole displacement is always covered: with
    // the defaults a 0.1 s frame at the maximum fall speed travels 3 m, which
    // needs 35 sub-steps of 0.086 m — less than the 0.16 m of the thinnest
    // wall in the game, so nothing can be tunnelled through and no part of
    // the movement is dropped.
    const maxStep = Math.max(0.02, this.options.radius * 0.25);
    const steps = Math.max(1, Math.min(64, Math.ceil(displacement / maxStep)));
    const stepDt = dt / steps;

    for (let i = 0; i < steps; i++) {
      this.moveVertical(this.velocity.y * stepDt, stepDt);
      this.moveHorizontal('x', this.velocity.x * stepDt);
      this.moveHorizontal('z', this.velocity.z * stepDt);
      this.resolveDynamicContacts(stepDt);
    }
  }

  private moveVertical(amount: number, dt: number): void {
    this.position.y += amount;
    const contacts = this.collectContacts().items;
    this.grounded = this.resolveVerticalContacts(contacts, dt);
  }

  private moveHorizontal(axis: 'x' | 'z', amount: number): void {
    if (Math.abs(amount) < EPS) return;

    const start = this.position[axis];
    this.position[axis] += amount;

    let contacts = this.collectContacts().items;
    let evaluation = this.evaluateHorizontalContacts(contacts);

    if (!evaluation.blocked) {
      this.resolveVerticalContacts(contacts, 0);
      return;
    }

    const stepTarget = evaluation.stepTarget;
    if (stepTarget !== null) {
      this.captureStepState();
      if (this.tryStepUp(stepTarget)) {
        // The character was lifted: retry the horizontal movement from the new height.
        this.position[axis] = start + amount;
        contacts = this.collectContacts().items;
        evaluation = this.evaluateHorizontalContacts(contacts);
        if (evaluation.blocked) {
          // The step up is abandoned: the vertical position and the vertical
          // velocity have to go back as well, otherwise the avatar would be
          // left floating on top of the step it could not climb.
          this.restoreStepState();
          this.position[axis] = start;
          this.velocity[axis] = 0;
          return;
        }
        this.resolveVerticalContacts(contacts, 0);
        return;
      }
    }

    this.position[axis] = start;
    this.velocity[axis] = 0;
  }

  /** Saves the vertical state of the character before a step up attempt. */
  private captureStepState(): void {
    this.stepState.y = this.position.y;
    this.stepState.velocityY = this.velocity.y;
    this.stepState.grounded = this.grounded;
    this.stepState.groundNormal.copy(this.groundNormal);
  }

  /** Restores the vertical state saved by `captureStepState`. */
  private restoreStepState(): void {
    this.position.y = this.stepState.y;
    this.velocity.y = this.stepState.velocityY;
    this.grounded = this.stepState.grounded;
    this.groundNormal.copy(this.stepState.groundNormal);
  }

  /**
   * Resolves the contacts of the character against the dynamic bodies.
   *
   * The character is not a rigid body, but it does push what it touches: the
   * overlap is separated along the contact normal (the character leaves the
   * body) and the body receives a mass weighted impulse in the opposite
   * direction. The impulse is limited by the force the character can exert,
   * so a heavy crate resists more than a light ball, and the character can
   * only advance as fast as the body it shoves leaves: that is the momentum
   * transfer the player feels.
   *
   * The contact normal always points FROM the body TO the character, so a
   * positive component of a velocity along the normal means "moving towards
   * the other one".
   */
  private resolveDynamicContacts(dt: number): void {
    for (const body of this.world.bodies) {
      const contact = scratchDynamic;
      if (!this.dynamicContact(body, contact)) continue;

      // 1. Separation: the character leaves the body. The body is never
      //    teleported, it only moves through its own velocity.
      this.position.addScaledVector(contact.normal, contact.penetration);

      // 2. A body that is asleep wakes up when the player touches it.
      this.world.wakeBody(body);

      if (body.inverseMass <= 0) continue;

      const normal = contact.normal;
      // Speed of the character towards the body (> 0 when it walks into it).
      const charApproach = -this.velocity.dot(normal);
      // Speed of the body towards the character (> 0 when it rolls into it).
      const bodyImpact = body.velocity.dot(normal);

      if (charApproach > PUSH_MIN_APPROACH) {
        if (bodyImpact > 0) {
          // Head on: the character stops and the body bounces off it.
          this.velocity.addScaledVector(normal, charApproach);
          this.bounceBody(body, normal, bodyImpact);
        } else {
          // The character walks into the body: it pushes it away.
          const target = charApproach * PUSH_SPEED_TRANSFER;
          const current = Math.max(0, -bodyImpact);
          const demand = Math.max(0, target - current) * body.mass;
          const budget = PUSH_FORCE * dt;
          const impulse = Math.min(demand, budget);
          if (impulse > 0) {
            body.velocity.addScaledVector(normal, -impulse * body.inverseMass);
          }

          // Momentum transfer: the character gives part of its momentum away.
          this.velocity.addScaledVector(normal, impulse / CHARACTER_CONTACT_MASS);

          // The character cannot advance into the body faster than the body
          // leaves it: this is what makes a heavy crate slow the player down.
          const separating = Math.max(0, -bodyImpact);
          if (charApproach > separating) {
            this.velocity.addScaledVector(normal, charApproach - separating);
          }
        }
      } else if (bodyImpact > BOUNCE_THRESHOLD) {
        // The body rolls into the character: the character acts as a wall.
        this.bounceBody(body, normal, bodyImpact);
      }
    }
  }

  /**
   * Reflects the velocity of a body that hits the character and applies the
   * tangential friction of the contact. `impact` is the speed of the body
   * towards the character.
   */
  private bounceBody(body: RigidBody, normal: THREE.Vector3, impact: number): void {
    const bounce = impact > BOUNCE_THRESHOLD ? body.restitution : 0;
    body.velocity.addScaledVector(normal, -(1 + bounce) * impact);

    const tangentX = body.velocity.x - normal.x * body.velocity.dot(normal);
    const tangentY = body.velocity.y - normal.y * body.velocity.dot(normal);
    const tangentZ = body.velocity.z - normal.z * body.velocity.dot(normal);
    const tangentLength = Math.sqrt(tangentX * tangentX + tangentY * tangentY + tangentZ * tangentZ);
    if (tangentLength > EPS) {
      const maxDelta = body.friction * impact;
      const scale = Math.min(1, maxDelta / tangentLength);
      body.velocity.x -= tangentX * scale;
      body.velocity.y -= tangentY * scale;
      body.velocity.z -= tangentZ * scale;
    }
  }

  /**
   * Computes the contact between the capsule of the character and a dynamic
   * body. The normal always points from the body towards the character.
   */
  private dynamicContact(body: RigidBody, out: DynamicContact): boolean {
    const radius = this.options.radius;
    const height = this.options.height;
    const bottomY = this.position.y + radius;
    const topY = this.position.y + height - radius;

    if (body.shape === 'sphere') {
      // Closest point of the capsule segment to the centre of the ball. The
      // normal points FROM the body TO the character, so separating the
      // character means moving it along the normal.
      const closestY = clamp(body.position.y, bottomY, topY);
      scratchA.set(this.position.x, closestY, this.position.z);
      scratchB.copy(scratchA).sub(body.position);
      const distance = scratchB.length();
      const reach = radius + body.radius;
      if (distance >= reach) return false;
      if (distance < EPS) {
        out.normal.set(-1, 0, 0);
        out.penetration = reach;
        return true;
      }
      out.normal.copy(scratchB).multiplyScalar(1 / distance);
      out.penetration = reach - distance;
      return true;
    }

    // Box body: closest point between the vertical capsule segment and the AABB.
    const minX = body.position.x - body.half.x;
    const maxX = body.position.x + body.half.x;
    const minY = body.position.y - body.half.y;
    const maxY = body.position.y + body.half.y;
    const minZ = body.position.z - body.half.z;
    const maxZ = body.position.z + body.half.z;

    // Vertical point of the segment that is closest to the box.
    const overlapLow = Math.max(bottomY, minY);
    const overlapHigh = Math.min(topY, maxY);
    const segmentY =
      overlapLow <= overlapHigh
        ? (overlapLow + overlapHigh) * 0.5
        : body.position.y > topY
          ? topY
          : bottomY;

    scratchA.set(this.position.x, segmentY, this.position.z);
    scratchB.set(
      clamp(scratchA.x, minX, maxX),
      clamp(scratchA.y, minY, maxY),
      clamp(scratchA.z, minZ, maxZ),
    );
    scratchC.copy(scratchA).sub(scratchB);
    const distance = scratchC.length();
    if (distance >= radius) return false;
    if (distance < EPS) {
      // The capsule axis is inside the box: escape through the closest side.
      const left = scratchA.x - minX;
      const right = maxX - scratchA.x;
      const back = scratchA.z - minZ;
      const front = maxZ - scratchA.z;
      const best = Math.min(left, right, back, front);
      if (best === left) out.normal.set(-1, 0, 0);
      else if (best === right) out.normal.set(1, 0, 0);
      else if (best === back) out.normal.set(0, 0, -1);
      else out.normal.set(0, 0, 1);
      out.penetration = radius;
      return true;
    }
    out.normal.copy(scratchC).multiplyScalar(1 / distance);
    out.penetration = radius - distance;
    return true;
  }

  /** Resolves contacts along the vertical axis. Returns true when a walkable floor was found. */
  private resolveVerticalContacts(contacts: CapsuleContact[], dt: number): boolean {
    let grounded = false;

    for (const contact of contacts) {
      // A contact with no penetration still means "touching": the character
      // must stay grounded while it rests on the surface.
      if (contact.penetration <= -CONTACT_TOLERANCE) continue;

      if (contact.normal.y > 0.5) {
        if (contact.penetration > 0) this.position.y += contact.penetration;
        if (this.velocity.y < 0) {
          if (-this.velocity.y > this.pendingLandingSpeed) this.pendingLandingSpeed = -this.velocity.y;
          this.velocity.y = 0;
        }
        if (contact.normal.y >= this.maxSlopeCos) {
          grounded = true;
          this.groundNormal.copy(contact.normal);
        } else {
          // Too steep to stand on: slide down the slope.
          this.slideOnSlope(contact.normal, dt);
        }
      } else if (contact.normal.y < -0.5) {
        if (contact.penetration > 0) this.position.y -= contact.penetration;
        if (this.velocity.y > 0) this.velocity.y = 0;
      }
    }

    return grounded;
  }

  /** Finds out whether the horizontal move was blocked and which surface could be stepped onto. */
  private evaluateHorizontalContacts(contacts: CapsuleContact[]): { blocked: boolean; stepTarget: number | null } {
    let blocked = false;
    let stepTarget: number | null = null;

    for (const contact of contacts) {
      if (contact.penetration <= 0) continue;

      const top = this.staticTop(contact.collider);
      const rise = top - this.position.y;
      const steppable = rise > 0.01 && rise <= this.options.stepHeight;

      if (Math.abs(contact.normal.y) < 0.7) {
        blocked = true;
        if (steppable && (stepTarget === null || top > stepTarget)) stepTarget = top;
      } else if (contact.normal.y > 0 && steppable && (stepTarget === null || top > stepTarget)) {
        stepTarget = top;
      }
    }

    return { blocked, stepTarget };
  }

  /** Lifts the character onto `target` when there is headroom. */
  private tryStepUp(target: number): boolean {
    const rise = target - this.position.y;
    if (rise <= 0.01 || rise > this.options.stepHeight) return false;

    const previousY = this.position.y;
    this.position.y = target;

    // Head room: only the volume DIRECTLY ABOVE the step is checked. A tall
    // wall next to the ledge does not block the step up (the character stands
    // beside it) and neither does a slab that is over its head.
    if (!this.hasHeadRoom(target)) {
      this.position.y = previousY;
      return false;
    }

    if (this.velocity.y < 0) this.velocity.y = 0;
    this.grounded = true;
    this.groundNormal.set(0, 1, 0);
    return true;
  }

  /**
   * True when the volume directly above the character is free between the
   * step top and its head.
   */
  private hasHeadRoom(target: number): boolean {
    const low = target + 0.02;
    const high = target + this.options.height - 0.02;
    if (high <= low) return true;

    const x = this.position.x;
    const z = this.position.z;

    scratchA.set(x - 0.05, low, z - 0.05);
    scratchB.set(x + 0.05, high, z + 0.05);

    for (const collider of this.world.queryStatics(scratchA, scratchB)) {
      if (collider.isTrigger) continue;

      if (collider.shape === 'box') {
        const insideX = x >= collider.center.x - collider.half.x && x <= collider.center.x + collider.half.x;
        const insideZ = z >= collider.center.z - collider.half.z && z <= collider.center.z + collider.half.z;
        if (!insideX || !insideZ) continue;
        const minY = collider.center.y - collider.half.y;
        const maxY = collider.center.y + collider.half.y;
        if (maxY <= low || minY >= high) continue;
        return false;
      }

      const dx = x - collider.center.x;
      const dz = z - collider.center.z;
      if (dx * dx + dz * dz > collider.radius * collider.radius) continue;
      if (collider.center.y + collider.radius <= low) continue;
      if (collider.center.y - collider.radius >= high) continue;
      return false;
    }

    return true;
  }

  private slideOnSlope(normal: THREE.Vector3, dt: number): void {
    if (dt <= 0) return;
    const normalVelocity = this.velocity.dot(normal);
    if (normalVelocity < 0) this.velocity.addScaledVector(normal, -normalVelocity);

    const gravity = this.world.gravity;
    const alongNormal = gravity * normal.y;
    this.velocity.x += -alongNormal * normal.x * dt;
    this.velocity.y += (gravity - alongNormal * normal.y) * dt;
    this.velocity.z += -alongNormal * normal.z * dt;
  }

  private snapToGround(wasGrounded: boolean): void {
    const support = this.probeGround();
    if (!support) return;

    const drop = this.position.y - support.y;
    if (drop < -0.001 || drop > this.options.groundSnapDistance) return;
    if (!wasGrounded && this.velocity.y < -2) return;

    this.position.y = support.y;
    this.velocity.y = 0;
    this.grounded = true;
    this.groundNormal.copy(support);
  }

  /** Finds the walkable surface right below the character. */
  private probeGround(): THREE.Vector3 | null {
    const originY = this.position.y + this.options.radius + 0.02;
    scratchA.set(this.position.x, originY, this.position.z);
    scratchB.set(0, -1, 0);

    const maxDistance = this.options.radius + 0.02 + this.options.groundSnapDistance;
    const hit = this.world.raycast(scratchA, scratchB, maxDistance);
    if (!hit) return null;
    if (hit.distance < 1e-3) return null;
    if (hit.point.y > this.position.y + 0.02) return null;
    if (hit.normal.y < this.maxSlopeCos) return null;

    return scratchNormal.copy(hit.normal);
  }

  // ---------------------------------------------------------------------------
  // Broad phase helpers
  // ---------------------------------------------------------------------------

  private collectContacts(): ContactBuffer {
    this.bufferIndex = (this.bufferIndex + 1) % this.contactBuffers.length;
    const buffer = this.contactBuffers[this.bufferIndex];
    const items = buffer.items;
    items.length = 0;

    const radius = this.options.radius;
    const height = this.options.height;
    const margin = radius + 0.05;

    scratchA.set(this.position.x - margin, this.position.y, this.position.z - margin);
    scratchB.set(this.position.x + margin, this.position.y + height, this.position.z + margin);

    let poolIndex = 0;
    for (const collider of this.world.queryStatics(scratchA, scratchB)) {
      if (collider.isTrigger) continue;

      let contact = buffer.pool[poolIndex];
      if (!contact) {
        contact = { collider, normal: new THREE.Vector3(), penetration: 0 };
        buffer.pool[poolIndex] = contact;
      }
      contact.collider = collider;
      contact.penetration = 0;

      const touching =
        collider.shape === 'box'
          ? capsuleBoxContact(this.position, radius, height, collider, contact)
          : capsuleSphereContact(this.position, radius, height, collider, contact);
      if (!touching) continue;

      items.push(contact);
      poolIndex += 1;
    }

    return buffer;
  }

  private staticTop(collider: StaticCollider): number {
    return collider.shape === 'box' ? collider.center.y + collider.half.y : collider.center.y + collider.radius;
  }

  private buildState(justLanded: boolean, landingSpeed: number): CharacterState {
    return {
      position: this.position,
      velocity: this.velocity,
      grounded: this.grounded,
      groundNormal: this.groundNormal,
      justLanded,
      landingSpeed,
      speed: Math.sqrt(this.velocity.x * this.velocity.x + this.velocity.z * this.velocity.z),
      sprinting: this.sprinting,
    };
  }
}
