import * as THREE from 'three';
import type {
  BoxCollider,
  RaycastHit,
  RigidBody,
  SphereCollider,
  StaticCollider,
} from './types';

/** Tuning constants of the rigid body solver. */
export interface PhysicsWorldOptions {
  /** Downward acceleration in m/s². */
  gravity?: number;
  /** Duration of a single simulation sub-step in seconds. */
  fixedStep?: number;
  /** Maximum number of sub-steps consumed by a single `step()` call. */
  maxSubSteps?: number;
}

const DEFAULT_GRAVITY = -9.81;
const DEFAULT_FIXED_STEP = 1 / 120;
/**
 * 12 sub-steps of 1/120 s cover exactly the 0.1 s that the scene clamps a
 * frame to, so the physics time base never lags behind the character.
 */
const DEFAULT_MAX_SUB_STEPS = 12;
const GRID_CELL_SIZE = 4;
const SLEEP_LINEAR_SPEED = 0.05;
const SLEEP_DELAY = 0.25;
const WAKE_IMPULSE = 0.4;
/** Penetration that is left untouched when a contact is resolved. */
const CONTACT_SLOP = 0.001;
/** Distance (m) at which a moving body wakes a sleeping neighbour. */
const WAKE_PROXIMITY = 1;
/** Below this approach speed (m/s) no bounce is applied, so resting bodies stay put. */
const RESTITUTION_THRESHOLD = 1;
const EPS = 1e-8;

/** A single contact between two shapes. The normal always points from the obstacle towards the body. */
interface Contact {
  normal: THREE.Vector3;
  penetration: number;
}

interface BodyRuntime {
  /** Continuous time the body has been supported by a surface. */
  supportTime: number;
  /** True when the last resolution found a surface holding the body up. */
  supported: boolean;
  /** Position snapshot used to detect programmatic moves of sleeping bodies. */
  sleepPosition: THREE.Vector3;
}

const scratchContact: Contact = { normal: new THREE.Vector3(), penetration: 0 };
const scratchContactB: Contact = { normal: new THREE.Vector3(), penetration: 0 };
const scratchA = new THREE.Vector3();
const scratchB = new THREE.Vector3();
const scratchC = new THREE.Vector3();
const scratchDir = new THREE.Vector3();
const scratchQuat = new THREE.Quaternion();

function clamp(value: number, min: number, max: number): number {
  return value < min ? min : value > max ? max : value;
}

/** Sphere against an axis aligned box. */
function sphereBoxContact(
  center: THREE.Vector3,
  radius: number,
  boxCenter: THREE.Vector3,
  boxHalf: THREE.Vector3,
  out: Contact,
): boolean {
  const minX = boxCenter.x - boxHalf.x;
  const maxX = boxCenter.x + boxHalf.x;
  const minY = boxCenter.y - boxHalf.y;
  const maxY = boxCenter.y + boxHalf.y;
  const minZ = boxCenter.z - boxHalf.z;
  const maxZ = boxCenter.z + boxHalf.z;

  const cx = clamp(center.x, minX, maxX);
  const cy = clamp(center.y, minY, maxY);
  const cz = clamp(center.z, minZ, maxZ);

  const dx = center.x - cx;
  const dy = center.y - cy;
  const dz = center.z - cz;
  const distSq = dx * dx + dy * dy + dz * dz;

  if (distSq > radius * radius) return false;

  if (distSq > EPS) {
    const dist = Math.sqrt(distSq);
    out.normal.set(dx / dist, dy / dist, dz / dist);
    out.penetration = radius - dist;
    return true;
  }

  // The sphere centre is inside the box: escape through the nearest face.
  let depth = center.x - minX;
  let nx = -1;
  let ny = 0;
  let nz = 0;
  const distXPos = maxX - center.x;
  const distYNeg = center.y - minY;
  const distYPos = maxY - center.y;
  const distZNeg = center.z - minZ;
  const distZPos = maxZ - center.z;

  if (distXPos < depth) {
    depth = distXPos;
    nx = 1;
    ny = 0;
    nz = 0;
  }
  if (distYNeg < depth) {
    depth = distYNeg;
    nx = 0;
    ny = -1;
    nz = 0;
  }
  if (distYPos < depth) {
    depth = distYPos;
    nx = 0;
    ny = 1;
    nz = 0;
  }
  if (distZNeg < depth) {
    depth = distZNeg;
    nx = 0;
    ny = 0;
    nz = -1;
  }
  if (distZPos < depth) {
    depth = distZPos;
    nx = 0;
    ny = 0;
    nz = 1;
  }

  out.normal.set(nx, ny, nz);
  out.penetration = radius + depth;
  return true;
}

/** Box against a sphere. The normal points from the sphere towards the box. */
function boxSphereContact(
  boxCenter: THREE.Vector3,
  boxHalf: THREE.Vector3,
  sphereCenter: THREE.Vector3,
  radius: number,
  out: Contact,
): boolean {
  const minX = boxCenter.x - boxHalf.x;
  const maxX = boxCenter.x + boxHalf.x;
  const minY = boxCenter.y - boxHalf.y;
  const maxY = boxCenter.y + boxHalf.y;
  const minZ = boxCenter.z - boxHalf.z;
  const maxZ = boxCenter.z + boxHalf.z;

  const cx = clamp(sphereCenter.x, minX, maxX);
  const cy = clamp(sphereCenter.y, minY, maxY);
  const cz = clamp(sphereCenter.z, minZ, maxZ);

  const dx = cx - sphereCenter.x;
  const dy = cy - sphereCenter.y;
  const dz = cz - sphereCenter.z;
  const distSq = dx * dx + dy * dy + dz * dz;

  if (distSq > radius * radius) return false;

  if (distSq > EPS) {
    const dist = Math.sqrt(distSq);
    out.normal.set(dx / dist, dy / dist, dz / dist);
    out.penetration = radius - dist;
    return true;
  }

  // The sphere centre is inside the box: escape through the nearest face.
  let depth = sphereCenter.x - minX;
  let nx = -1;
  let ny = 0;
  let nz = 0;
  const distXPos = maxX - sphereCenter.x;
  const distYNeg = sphereCenter.y - minY;
  const distYPos = maxY - sphereCenter.y;
  const distZNeg = sphereCenter.z - minZ;
  const distZPos = maxZ - sphereCenter.z;

  if (distXPos < depth) {
    depth = distXPos;
    nx = 1;
    ny = 0;
    nz = 0;
  }
  if (distYNeg < depth) {
    depth = distYNeg;
    nx = 0;
    ny = -1;
    nz = 0;
  }
  if (distYPos < depth) {
    depth = distYPos;
    nx = 0;
    ny = 1;
    nz = 0;
  }
  if (distZNeg < depth) {
    depth = distZNeg;
    nx = 0;
    ny = 0;
    nz = -1;
  }
  if (distZPos < depth) {
    depth = distZPos;
    nx = 0;
    ny = 0;
    nz = 1;
  }

  out.normal.set(nx, ny, nz);
  out.penetration = radius + depth;
  return true;
}

/** Two axis aligned boxes. The normal points from A towards B. */
function boxBoxContact(
  aCenter: THREE.Vector3,
  aHalf: THREE.Vector3,
  bCenter: THREE.Vector3,
  bHalf: THREE.Vector3,
  out: Contact,
): boolean {
  const dx = bCenter.x - aCenter.x;
  const dy = bCenter.y - aCenter.y;
  const dz = bCenter.z - aCenter.z;

  const overlapX = aHalf.x + bHalf.x - Math.abs(dx);
  if (overlapX <= 0) return false;
  const overlapY = aHalf.y + bHalf.y - Math.abs(dy);
  if (overlapY <= 0) return false;
  const overlapZ = aHalf.z + bHalf.z - Math.abs(dz);
  if (overlapZ <= 0) return false;

  if (overlapX <= overlapY && overlapX <= overlapZ) {
    out.normal.set(dx >= 0 ? 1 : -1, 0, 0);
    out.penetration = overlapX;
  } else if (overlapY <= overlapZ) {
    out.normal.set(0, dy >= 0 ? 1 : -1, 0);
    out.penetration = overlapY;
  } else {
    out.normal.set(0, 0, dz >= 0 ? 1 : -1);
    out.penetration = overlapZ;
  }
  return true;
}

/**
 * Deterministic 3D physics world.
 *
 * The world owns the static geometry (the level), the dynamic bodies and the
 * simulation loop. Everything is expressed in metres, seconds and m/s².
 */
export class PhysicsWorld {
  /** Downward acceleration in m/s². Mutable so levels can change gravity at runtime. */
  public gravity: number;
  /** Duration of a single simulation sub-step in seconds. */
  public readonly fixedStep: number;
  /** Maximum number of sub-steps consumed per `step()` call. */
  public readonly maxSubSteps: number;

  /** Dynamic bodies, in insertion order. */
  public readonly bodies: RigidBody[] = [];
  /** Static colliders, in insertion order. */
  public readonly statics: StaticCollider[] = [];

  /** Fired the first sub-step a body overlaps a trigger collider. */
  public onTriggerEnter?: (body: RigidBody, collider: StaticCollider) => void;
  /** Fired the first sub-step a body stops overlapping a trigger collider. */
  public onTriggerExit?: (body: RigidBody, collider: StaticCollider) => void;
  /** Fired when a body starts touching a solid collider. `impulse` is the contact impulse in N·s. */
  public onBodyContact?: (body: RigidBody, collider: StaticCollider, impulse: number) => void;

  private accumulator = 0;
  private nextStaticId = 0;
  private readonly grid = new Map<string, StaticCollider[]>();
  private readonly staticOrder = new Map<string, number>();
  private readonly bodyRuntime = new Map<RigidBody, BodyRuntime>();
  private readonly triggerState = new Map<RigidBody, Map<string, StaticCollider>>();
  private readonly contactState = new Map<RigidBody, Set<string>>();
  /** Reused buffer with the colliders a body is touching in the current sub-step. */
  private readonly touchingScratch = new Set<string>();

  constructor(options?: PhysicsWorldOptions) {
    this.gravity = options?.gravity ?? DEFAULT_GRAVITY;
    this.fixedStep = options?.fixedStep ?? DEFAULT_FIXED_STEP;
    this.maxSubSteps = options?.maxSubSteps ?? DEFAULT_MAX_SUB_STEPS;
  }

  // ---------------------------------------------------------------------------
  // Static geometry
  // ---------------------------------------------------------------------------

  /** Registers an axis aligned box. The vectors are copied. */
  public addStaticBox(
    center: THREE.Vector3,
    half: THREE.Vector3,
    options?: Partial<Omit<BoxCollider, 'shape' | 'center' | 'half'>>,
  ): BoxCollider {
    const collider: BoxCollider = {
      id: options?.id ?? `static-box-${this.nextStaticId++}`,
      shape: 'box',
      center: center.clone(),
      half: half.clone(),
      friction: options?.friction ?? 0.5,
      restitution: options?.restitution ?? 0,
      isTrigger: options?.isTrigger ?? false,
      tag: options?.tag ?? 'static',
      userData: options?.userData ?? null,
    };
    this.registerStatic(collider);
    return collider;
  }

  /** Registers a sphere. The vector is copied. */
  public addStaticSphere(
    center: THREE.Vector3,
    radius: number,
    options?: Partial<Omit<SphereCollider, 'shape' | 'center' | 'radius'>>,
  ): SphereCollider {
    const collider: SphereCollider = {
      id: options?.id ?? `static-sphere-${this.nextStaticId++}`,
      shape: 'sphere',
      center: center.clone(),
      radius: Math.max(0, radius),
      friction: options?.friction ?? 0.5,
      restitution: options?.restitution ?? 0,
      isTrigger: options?.isTrigger ?? false,
      tag: options?.tag ?? 'static',
      userData: options?.userData ?? null,
    };
    this.registerStatic(collider);
    return collider;
  }

  /** Removes a static collider. Returns false when the id is unknown. */
  public removeStatic(id: string): boolean {
    const index = this.statics.findIndex((collider) => collider.id === id);
    if (index < 0) return false;

    const [collider] = this.statics.splice(index, 1);
    this.unindexStatic(collider);
    this.staticOrder.delete(id);

    for (const active of this.triggerState.values()) active.delete(id);
    for (const active of this.contactState.values()) active.delete(id);
    return true;
  }

  /** Removes every static collider. */
  public clearStatics(): void {
    this.statics.length = 0;
    this.grid.clear();
    this.staticOrder.clear();
    for (const active of this.triggerState.values()) active.clear();
    for (const active of this.contactState.values()) active.clear();
  }

  private registerStatic(collider: StaticCollider): void {
    this.statics.push(collider);
    this.staticOrder.set(collider.id, this.statics.length - 1);
    this.indexStatic(collider);
  }

  private staticBounds(collider: StaticCollider): { minX: number; maxX: number; minZ: number; maxZ: number } {
    if (collider.shape === 'box') {
      return {
        minX: collider.center.x - collider.half.x,
        maxX: collider.center.x + collider.half.x,
        minZ: collider.center.z - collider.half.z,
        maxZ: collider.center.z + collider.half.z,
      };
    }
    return {
      minX: collider.center.x - collider.radius,
      maxX: collider.center.x + collider.radius,
      minZ: collider.center.z - collider.radius,
      maxZ: collider.center.z + collider.radius,
    };
  }

  private indexStatic(collider: StaticCollider): void {
    const bounds = this.staticBounds(collider);
    const cx0 = Math.floor(bounds.minX / GRID_CELL_SIZE);
    const cx1 = Math.floor(bounds.maxX / GRID_CELL_SIZE);
    const cz0 = Math.floor(bounds.minZ / GRID_CELL_SIZE);
    const cz1 = Math.floor(bounds.maxZ / GRID_CELL_SIZE);

    for (let cx = cx0; cx <= cx1; cx++) {
      for (let cz = cz0; cz <= cz1; cz++) {
        const key = `${cx},${cz}`;
        const cell = this.grid.get(key);
        if (cell) cell.push(collider);
        else this.grid.set(key, [collider]);
      }
    }
  }

  private unindexStatic(collider: StaticCollider): void {
    const bounds = this.staticBounds(collider);
    const cx0 = Math.floor(bounds.minX / GRID_CELL_SIZE);
    const cx1 = Math.floor(bounds.maxX / GRID_CELL_SIZE);
    const cz0 = Math.floor(bounds.minZ / GRID_CELL_SIZE);
    const cz1 = Math.floor(bounds.maxZ / GRID_CELL_SIZE);

    for (let cx = cx0; cx <= cx1; cx++) {
      for (let cz = cz0; cz <= cz1; cz++) {
        const key = `${cx},${cz}`;
        const cell = this.grid.get(key);
        if (!cell) continue;
        const index = cell.indexOf(collider);
        if (index >= 0) cell.splice(index, 1);
        if (cell.length === 0) this.grid.delete(key);
      }
    }
  }

  /**
   * Broad phase query. Only the XZ footprint of the box is taken into account,
   * the Y range is filtered by the precise narrow phase afterwards.
   */
  public queryStatics(min: THREE.Vector3, max: THREE.Vector3): StaticCollider[] {
    const cx0 = Math.floor(Math.min(min.x, max.x) / GRID_CELL_SIZE);
    const cx1 = Math.floor(Math.max(min.x, max.x) / GRID_CELL_SIZE);
    const cz0 = Math.floor(Math.min(min.z, max.z) / GRID_CELL_SIZE);
    const cz1 = Math.floor(Math.max(min.z, max.z) / GRID_CELL_SIZE);

    const seen = new Set<string>();
    const found: StaticCollider[] = [];
    for (let cx = cx0; cx <= cx1; cx++) {
      for (let cz = cz0; cz <= cz1; cz++) {
        const cell = this.grid.get(`${cx},${cz}`);
        if (!cell) continue;
        for (const collider of cell) {
          if (seen.has(collider.id)) continue;
          seen.add(collider.id);
          found.push(collider);
        }
      }
    }

    // Restore insertion order so the simulation stays deterministic.
    found.sort((a, b) => (this.staticOrder.get(a.id) ?? 0) - (this.staticOrder.get(b.id) ?? 0));
    return found;
  }

  // ---------------------------------------------------------------------------
  // Dynamic bodies
  // ---------------------------------------------------------------------------

  /** Creates a dynamic body. */
  public addBody(options: {
    id: string;
    shape: 'box' | 'sphere';
    position: THREE.Vector3;
    half?: THREE.Vector3;
    radius?: number;
    mass?: number;
    friction?: number;
    restitution?: number;
    linearDamping?: number;
    gravityScale?: number;
    tag?: string;
    userData?: unknown;
    mesh?: THREE.Object3D;
  }): RigidBody {
    this.removeBody(options.id);

    const mass = options.mass ?? 1;
    const body: RigidBody = {
      id: options.id,
      shape: options.shape,
      position: options.position.clone(),
      velocity: new THREE.Vector3(),
      rotation: new THREE.Quaternion(),
      angularVelocity: new THREE.Vector3(),
      half: options.shape === 'box' ? (options.half?.clone() ?? new THREE.Vector3(0.5, 0.5, 0.5)) : new THREE.Vector3(),
      radius: options.shape === 'sphere' ? (options.radius ?? 0.5) : 0,
      mass,
      inverseMass: mass > 0 ? 1 / mass : 0,
      friction: options.friction ?? 0.5,
      restitution: options.restitution ?? 0,
      linearDamping: options.linearDamping ?? 0,
      gravityScale: options.gravityScale ?? 1,
      sleeping: false,
      tag: options.tag ?? 'dynamic',
      userData: options.userData ?? null,
    };
    if (options.mesh) body.mesh = options.mesh;

    this.bodies.push(body);
    this.bodyRuntime.set(body, { supportTime: 0, supported: false, sleepPosition: body.position.clone() });
    return body;
  }

  /** Removes a dynamic body. Returns false when the id is unknown. */
  public removeBody(id: string): boolean {
    const index = this.bodies.findIndex((body) => body.id === id);
    if (index < 0) return false;

    const [body] = this.bodies.splice(index, 1);
    this.bodyRuntime.delete(body);
    this.triggerState.delete(body);
    this.contactState.delete(body);
    return true;
  }

  /** Looks a body up by id. */
  public getBody(id: string): RigidBody | undefined {
    return this.bodies.find((body) => body.id === id);
  }

  /** Wakes a sleeping body so the next step integrates it again. */
  public wakeBody(body: RigidBody): void {
    if (!body.sleeping) return;
    body.sleeping = false;
    const runtime = this.bodyRuntime.get(body);
    if (runtime) runtime.supportTime = 0;
  }

  // ---------------------------------------------------------------------------
  // Simulation
  // ---------------------------------------------------------------------------

  /**
   * Advances the simulation. The frame time is accumulated and consumed in
   * fixed sub-steps so the result does not depend on the frame rate.
   *
   * The incoming delta is clamped to the sub-step budget
   * (`maxSubSteps * fixedStep`) so the world always consumes the whole frame
   * and can never spiral out of control. With the defaults (12 sub-steps of
   * 1/120 s) that budget is exactly the 0.1 s the scene clamps a frame to,
   * so the physics time base never runs slower than the character.
   */
  public step(delta: number): void {
    if (!Number.isFinite(delta) || delta <= 0) return;

    const budget = this.fixedStep * this.maxSubSteps;
    const frame = Math.min(delta, budget);
    this.accumulator = Math.min(this.accumulator + frame, budget);

    let steps = 0;
    while (this.accumulator >= this.fixedStep && steps < this.maxSubSteps) {
      this.accumulator -= this.fixedStep;
      this.subStep(this.fixedStep);
      steps++;
    }
  }

  private subStep(dt: number): void {
    this.wakeMovedBodies();

    for (const body of this.bodies) {
      if (body.sleeping) continue;
      this.integrateBody(body, dt);
    }

    for (let i = 0; i < this.bodies.length; i++) {
      for (let j = i + 1; j < this.bodies.length; j++) {
        this.resolveBodyPair(this.bodies[i], this.bodies[j]);
      }
    }

    this.updateTriggers();
    this.updateResting(dt);
  }

  private wakeMovedBodies(): void {
    for (const body of this.bodies) {
      if (!body.sleeping) continue;
      const runtime = this.bodyRuntime.get(body);
      if (!runtime) continue;
      const moved = body.position.distanceToSquared(runtime.sleepPosition) > 1e-10;
      const pushed = body.velocity.lengthSq() > 1e-10;
      if (moved || pushed) this.wakeBody(body);
    }
    this.wakeNearbyBodies();
  }

  /**
   * Wakes a sleeping body when another body is moving close to it: a rolling
   * ball must not be able to sleep while a crate slides past it.
   */
  private wakeNearbyBodies(): void {
    for (const body of this.bodies) {
      if (!body.sleeping) continue;
      for (const other of this.bodies) {
        if (other === body || other.sleeping) continue;
        if (other.velocity.lengthSq() <= 1e-10) continue;
        if (body.position.distanceToSquared(other.position) <= WAKE_PROXIMITY * WAKE_PROXIMITY) {
          this.wakeBody(body);
          break;
        }
      }
    }
  }

  private integrateBody(body: RigidBody, dt: number): void {
    const velocity = body.velocity;
    velocity.y += this.gravity * body.gravityScale * dt;
    velocity.multiplyScalar(Math.max(0, 1 - body.linearDamping * dt));
    body.position.addScaledVector(velocity, dt);

    this.resolveBodyVsStatics(body);

    if (body.shape === 'sphere' && body.radius > 0) {
      this.integrateRotation(body, dt);
    }

    if (body.mesh) {
      body.mesh.position.copy(body.position);
      body.mesh.quaternion.copy(body.rotation);
    }
  }

  private bodyBounds(body: RigidBody): { minX: number; maxX: number; minZ: number; maxZ: number } {
    // A box is not necessarily cubic: each axis uses its own half extent.
    const extentX = body.shape === 'box' ? body.half.x : body.radius;
    const extentZ = body.shape === 'box' ? body.half.z : body.radius;
    const sweep = Math.abs(body.velocity.x) * 1 / 120 + Math.abs(body.velocity.z) * 1 / 120;
    return {
      minX: body.position.x - extentX - sweep,
      maxX: body.position.x + extentX + sweep,
      minZ: body.position.z - extentZ - sweep,
      maxZ: body.position.z + extentZ + sweep,
    };
  }

  private resolveBodyVsStatics(body: RigidBody): void {
    const bounds = this.bodyBounds(body);
    scratchA.set(bounds.minX, body.position.y, bounds.minZ);
    scratchB.set(bounds.maxX, body.position.y, bounds.maxZ);
    const candidates = this.queryStatics(scratchA, scratchB);

    const runtime = this.bodyRuntime.get(body);
    let supported = false;
    const touching = this.touchingScratch;
    touching.clear();

    for (const collider of candidates) {
      if (collider.isTrigger) continue;

      const contact = scratchContact;
      let isTouching = false;
      if (body.shape === 'sphere') {
        isTouching =
          collider.shape === 'box'
            ? sphereBoxContact(body.position, body.radius, collider.center, collider.half, contact)
            : sphereSphereContact(body.position, body.radius, collider.center, collider.radius, contact);
      } else {
        isTouching =
          collider.shape === 'box'
            ? boxBoxContact(body.position, body.half, collider.center, collider.half, contact)
            : boxSphereContact(body.position, body.half, collider.center, collider.radius, contact);
        // The generic contact normal points from the body towards the obstacle.
        if (isTouching) contact.normal.negate();
      }
      if (!isTouching) continue;

      touching.add(collider.id);

      const impulse = this.applyStaticResponse(body, collider, contact);
      if (contact.normal.y > 0.5) supported = true;

      if (impulse > 0) {
        this.notifyContact(body, collider, impulse);
        if (impulse > WAKE_IMPULSE) this.wakeBody(body);
      }

      if (body.shape === 'sphere' && body.radius > 0) {
        this.applyRolling(body, contact.normal);
      }
    }

    if (runtime) runtime.supported = supported;

    // A contact that no longer exists is forgotten, so that a new contact with
    // the same collider can be reported again later (a ball that bounces and
    // lands on the same floor fires the callback twice).
    this.syncContactState(body, touching);
  }

  /** Drops the (body, collider) pairs that are not touching any more. */
  private syncContactState(body: RigidBody, touching: Set<string>): void {
    const active = this.contactState.get(body);
    if (!active) return;
    for (const id of active) {
      if (!touching.has(id)) active.delete(id);
    }
  }

  private applyStaticResponse(body: RigidBody, collider: StaticCollider, contact: Contact): number {
    if (contact.penetration > CONTACT_SLOP) {
      body.position.addScaledVector(contact.normal, contact.penetration - CONTACT_SLOP);
    }

    const velocity = body.velocity;
    const normalVelocity = velocity.dot(contact.normal);
    if (normalVelocity >= 0) return 0;

    // The bouncier surface wins, so a body with restitution bounces on plain geometry.
    const restitution = Math.max(body.restitution, collider.restitution);
    const approachSpeed = -normalVelocity;
    const bounce = approachSpeed > RESTITUTION_THRESHOLD ? restitution : 0;
    const normalDelta = (1 + bounce) * approachSpeed;

    const tangentX = velocity.x - contact.normal.x * normalVelocity;
    const tangentY = velocity.y - contact.normal.y * normalVelocity;
    const tangentZ = velocity.z - contact.normal.z * normalVelocity;
    const tangentLength = Math.sqrt(tangentX * tangentX + tangentY * tangentY + tangentZ * tangentZ);

    velocity.addScaledVector(contact.normal, normalDelta);

    if (tangentLength > EPS) {
      const friction = Math.sqrt(body.friction * collider.friction);
      const maxDelta = friction * normalDelta;
      const scale = Math.min(1, maxDelta / tangentLength);
      velocity.x -= tangentX * scale;
      velocity.y -= tangentY * scale;
      velocity.z -= tangentZ * scale;
    }

    return body.mass * normalDelta;
  }

  private applyRolling(body: RigidBody, normal: THREE.Vector3): void {
    if (body.radius <= 0) return;
    const velocity = body.velocity;
    scratchC.set(normal.y * velocity.z - normal.z * velocity.y, normal.z * velocity.x - normal.x * velocity.z, normal.x * velocity.y - normal.y * velocity.x);
    scratchC.multiplyScalar(1 / body.radius);
    body.angularVelocity.copy(scratchC);
  }

  private integrateRotation(body: RigidBody, dt: number): void {
    const omega = body.angularVelocity;
    const speed = omega.length();
    if (speed < EPS) return;
    scratchDir.copy(omega).multiplyScalar(1 / speed);
    scratchQuat.setFromAxisAngle(scratchDir, speed * dt);
    body.rotation.premultiply(scratchQuat);
    body.rotation.normalize();
  }

  private resolveBodyPair(a: RigidBody, b: RigidBody): void {
    const contact = scratchContactB;
    let touching = false;

    if (a.shape === 'sphere' && b.shape === 'sphere') {
      touching = sphereSphereContact(a.position, a.radius, b.position, b.radius, contact);
    } else if (a.shape === 'box' && b.shape === 'box') {
      touching = boxBoxContact(a.position, a.half, b.position, b.half, contact);
    } else if (a.shape === 'sphere') {
      touching = sphereBoxContact(a.position, a.radius, b.position, b.half, contact);
    } else {
      touching = sphereBoxContact(b.position, b.radius, a.position, a.half, contact);
      if (touching) contact.normal.negate();
    }
    if (!touching) return;

    const inverseMassSum = a.inverseMass + b.inverseMass;
    if (inverseMassSum <= 0) return;

    const relativeX = b.velocity.x - a.velocity.x;
    const relativeY = b.velocity.y - a.velocity.y;
    const relativeZ = b.velocity.z - a.velocity.z;
    const normalVelocity = relativeX * contact.normal.x + relativeY * contact.normal.y + relativeZ * contact.normal.z;
    if (normalVelocity >= 0) return;

    const restitution = Math.min(a.restitution, b.restitution);
    const normalImpulse = (-(1 + restitution) * normalVelocity) / inverseMassSum;

    a.velocity.addScaledVector(contact.normal, -normalImpulse * a.inverseMass);
    b.velocity.addScaledVector(contact.normal, normalImpulse * b.inverseMass);

    const tangentX = relativeX - contact.normal.x * normalVelocity;
    const tangentY = relativeY - contact.normal.y * normalVelocity;
    const tangentZ = relativeZ - contact.normal.z * normalVelocity;
    const tangentLength = Math.sqrt(tangentX * tangentX + tangentY * tangentY + tangentZ * tangentZ);
    if (tangentLength > EPS) {
      const dirX = tangentX / tangentLength;
      const dirY = tangentY / tangentLength;
      const dirZ = tangentZ / tangentLength;
      const friction = Math.sqrt(a.friction * b.friction);
      let tangentImpulse = -(relativeX * dirX + relativeY * dirY + relativeZ * dirZ) / inverseMassSum;
      const maxTangent = friction * normalImpulse;
      if (Math.abs(tangentImpulse) > maxTangent) tangentImpulse = Math.sign(tangentImpulse) * maxTangent;
      a.velocity.addScaledVector(scratchA.set(dirX, dirY, dirZ), -tangentImpulse * a.inverseMass);
      b.velocity.addScaledVector(scratchA.set(dirX, dirY, dirZ), tangentImpulse * b.inverseMass);
    }

    const correction = Math.max(0, contact.penetration - CONTACT_SLOP) / inverseMassSum;
    a.position.addScaledVector(contact.normal, -correction * a.inverseMass);
    b.position.addScaledVector(contact.normal, correction * b.inverseMass);

    if (normalImpulse > WAKE_IMPULSE) {
      this.wakeBody(a);
      this.wakeBody(b);
    }
  }

  private notifyContact(body: RigidBody, collider: StaticCollider, impulse: number): void {
    let active = this.contactState.get(body);
    if (!active) {
      active = new Set<string>();
      this.contactState.set(body, active);
    }
    if (active.has(collider.id)) return;
    active.add(collider.id);
    this.onBodyContact?.(body, collider, impulse);
  }

  private updateTriggers(): void {
    for (const body of this.bodies) {
      const bounds = this.bodyBounds(body);
      scratchA.set(bounds.minX, body.position.y, bounds.minZ);
      scratchB.set(bounds.maxX, body.position.y, bounds.maxZ);
      const candidates = this.queryStatics(scratchA, scratchB);

      const current = new Map<string, StaticCollider>();
      for (const collider of candidates) {
        if (!collider.isTrigger) continue;
        if (!this.overlapsStatic(body, collider)) continue;
        current.set(collider.id, collider);
      }

      const previous = this.triggerState.get(body);
      if (previous) {
        for (const [id, collider] of previous) {
          if (current.has(id)) continue;
          this.onTriggerExit?.(body, collider);
        }
      }
      for (const [id, collider] of current) {
        if (previous && previous.has(id)) continue;
        this.onTriggerEnter?.(body, collider);
      }
      this.triggerState.set(body, current);
    }
  }

  private overlapsStatic(body: RigidBody, collider: StaticCollider): boolean {
    const contact = scratchContact;
    if (body.shape === 'sphere') {
      return collider.shape === 'box'
        ? sphereBoxContact(body.position, body.radius, collider.center, collider.half, contact)
        : sphereSphereContact(body.position, body.radius, collider.center, collider.radius, contact);
    }
    const touching =
      collider.shape === 'box'
        ? boxBoxContact(body.position, body.half, collider.center, collider.half, contact)
        : boxSphereContact(body.position, body.half, collider.center, collider.radius, contact);
    return touching;
  }

  /**
   * Keeps track of the time a body has been resting on a surface. A body that
   * stays supported and almost still for `SLEEP_DELAY` seconds goes to sleep
   * and stops being integrated until something wakes it up again.
   */
  private updateResting(dt: number): void {
    for (const body of this.bodies) {
      if (body.sleeping) continue;
      const runtime = this.bodyRuntime.get(body);
      if (!runtime) continue;

      const speed = body.velocity.length();
      if (runtime.supported && speed < SLEEP_LINEAR_SPEED) {
        runtime.supportTime += dt;
        if (runtime.supportTime >= SLEEP_DELAY) {
          body.sleeping = true;
          body.velocity.set(0, 0, 0);
          body.angularVelocity.set(0, 0, 0);
          runtime.sleepPosition.copy(body.position);
        }
      } else {
        runtime.supportTime = 0;
      }
    }
  }

  // ---------------------------------------------------------------------------
  // Queries
  // ---------------------------------------------------------------------------

  /**
   * Casts a ray against the static geometry and returns the closest hit.
   * Returns null when the ray hits nothing.
   */
  public raycast(origin: THREE.Vector3, direction: THREE.Vector3, maxDistance: number): RaycastHit | null {
    const length = direction.length();
    if (length < EPS || maxDistance <= 0) return null;

    scratchDir.copy(direction).multiplyScalar(1 / length);

    let best: RaycastHit | null = null;
    let bestDistance = maxDistance;

    for (const collider of this.statics) {
      const hit =
        collider.shape === 'box'
          ? rayBox(origin, scratchDir, collider, bestDistance)
          : raySphere(origin, scratchDir, collider, bestDistance);
      if (!hit) continue;
      if (hit.distance < bestDistance) {
        bestDistance = hit.distance;
        best = hit;
      }
    }
    return best;
  }

  /** Returns every static collider overlapping the given sphere. */
  public overlapSphere(center: THREE.Vector3, radius: number): StaticCollider[] {
    const result: StaticCollider[] = [];
    scratchA.set(center.x - radius, center.y - radius, center.z - radius);
    scratchB.set(center.x + radius, center.y + radius, center.z + radius);
    for (const collider of this.queryStatics(scratchA, scratchB)) {
      const contact = scratchContact;
      const touching =
        collider.shape === 'box'
          ? sphereBoxContact(center, radius, collider.center, collider.half, contact)
          : sphereSphereContact(center, radius, collider.center, collider.radius, contact);
      if (touching) result.push(collider);
    }
    return result;
  }
}

/** Sphere against sphere. The normal points from the first sphere to the second. */
function sphereSphereContact(
  centerA: THREE.Vector3,
  radiusA: number,
  centerB: THREE.Vector3,
  radiusB: number,
  out: Contact,
): boolean {
  const dx = centerB.x - centerA.x;
  const dy = centerB.y - centerA.y;
  const dz = centerB.z - centerA.z;
  const distSq = dx * dx + dy * dy + dz * dz;
  const radii = radiusA + radiusB;
  if (distSq > radii * radii) return false;

  const dist = Math.sqrt(distSq);
  if (dist > EPS) {
    out.normal.set(dx / dist, dy / dist, dz / dist);
    out.penetration = radii - dist;
    return true;
  }

  out.normal.set(0, 1, 0);
  out.penetration = radii;
  return true;
}

/** Ray against an axis aligned box (slab method). */
function rayBox(
  origin: THREE.Vector3,
  direction: THREE.Vector3,
  box: BoxCollider,
  maxDistance: number,
): RaycastHit | null {
  const minX = box.center.x - box.half.x;
  const maxX = box.center.x + box.half.x;
  const minY = box.center.y - box.half.y;
  const maxY = box.center.y + box.half.y;
  const minZ = box.center.z - box.half.z;
  const maxZ = box.center.z + box.half.z;

  let tMin = 0;
  let tMax = maxDistance;
  let axis = -1;
  let sign = 1;

  for (let i = 0; i < 3; i++) {
    const o = i === 0 ? origin.x : i === 1 ? origin.y : origin.z;
    const d = i === 0 ? direction.x : i === 1 ? direction.y : direction.z;
    const lo = i === 0 ? minX : i === 1 ? minY : minZ;
    const hi = i === 0 ? maxX : i === 1 ? maxY : maxZ;

    if (Math.abs(d) < EPS) {
      if (o < lo || o > hi) return null;
      continue;
    }

    const inv = 1 / d;
    let t1 = (lo - o) * inv;
    let t2 = (hi - o) * inv;
    let entrySign = -1;
    if (t1 > t2) {
      const swap = t1;
      t1 = t2;
      t2 = swap;
      entrySign = 1;
    }
    if (t1 > tMin) {
      tMin = t1;
      axis = i;
      sign = entrySign;
    }
    if (t2 < tMax) tMax = t2;
    if (tMin > tMax) return null;
  }

  if (tMax < 0) return null;

  const distance = tMin > 0 ? tMin : 0;
  if (distance > maxDistance) return null;

  const point = new THREE.Vector3().copy(direction).multiplyScalar(distance).add(origin);
  const normal = new THREE.Vector3();
  if (axis < 0) {
    normal.copy(direction).negate();
  } else if (axis === 0) {
    normal.x = sign;
  } else if (axis === 1) {
    normal.y = sign;
  } else {
    normal.z = sign;
  }

  return { point, normal, distance, collider: box };
}

/** Ray against a sphere. */
function raySphere(
  origin: THREE.Vector3,
  direction: THREE.Vector3,
  sphere: SphereCollider,
  maxDistance: number,
): RaycastHit | null {
  const ox = origin.x - sphere.center.x;
  const oy = origin.y - sphere.center.y;
  const oz = origin.z - sphere.center.z;

  const b = ox * direction.x + oy * direction.y + oz * direction.z;
  const c = ox * ox + oy * oy + oz * oz - sphere.radius * sphere.radius;
  const discriminant = b * b - c;
  if (discriminant < 0) return null;

  const root = Math.sqrt(discriminant);
  let distance = -b - root;
  if (distance < 0) distance = -b + root;
  if (distance < 0 || distance > maxDistance) return null;

  const point = new THREE.Vector3().copy(direction).multiplyScalar(distance).add(origin);
  const normal = new THREE.Vector3().copy(point).sub(sphere.center).normalize();
  return { point, normal, distance, collider: sphere };
}
