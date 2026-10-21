import * as THREE from 'three';
import type { PhysicsWorld } from '../core/physics/PhysicsWorld';
import type { RigidBody } from '../core/physics/types';
import { LEVEL_ORIGIN } from './types';

/** Estilos visuales compartidos por los elementos del nivel. */
export interface LevelBuilderOptions {
  color?: number;
  roughness?: number;
  metalness?: number;
  friction?: number;
  restitution?: number;
}

export interface LevelBoxOptions extends LevelBuilderOptions {
  x: number;
  y: number;
  z: number;
  w: number;
  h: number;
  d: number;
  emissive?: number;
}

export interface LevelCylinderOptions {
  x: number;
  y: number;
  z: number;
  r: number;
  h: number;
  color?: number;
  metalness?: number;
}

export interface LevelSphereOptions {
  x: number;
  y: number;
  z: number;
  r: number;
  color?: number;
  metalness?: number;
}

export interface LevelBallOptions {
  x: number;
  y: number;
  z: number;
  r?: number;
  mass?: number;
  restitution?: number;
  friction?: number;
}

export interface LevelCrateOptions {
  x: number;
  y: number;
  z: number;
  size?: number;
  mass?: number;
}

export interface LevelGoalOptions {
  x: number;
  y: number;
  z: number;
  /** Ancho libre del arco. */
  w: number;
  /** Alto libre del arco. */
  h: number;
  /** Profundidad de la zona de meta. */
  d: number;
  label: string;
}

export interface LevelTargetZoneOptions {
  id: string;
  x: number;
  y: number;
  z: number;
  w: number;
  h: number;
  d: number;
}

export interface LevelCheckpointOptions {
  x: number;
  y: number;
  z: number;
}

/** Ficha coleccionable del nivel. */
export interface CollectibleInfo {
  id: string;
  /** Posición base en coordenadas de mundo. */
  position: THREE.Vector3;
  mesh: THREE.Mesh;
  collected: boolean;
}

/** Zona lógica donde se cuentan los cuerpos dinámicos empujados. */
export interface TargetZoneInfo {
  id: string;
  /** Centro de la caja en coordenadas de mundo. */
  center: THREE.Vector3;
  /** Semiejes de la caja. */
  half: THREE.Vector3;
}

/** Zona lógica de salida del nivel. */
export interface GoalZoneInfo {
  center: THREE.Vector3;
  half: THREE.Vector3;
  label: string;
}

/** Paleta de colores de la campaña. */
export const LEVEL_COLORS = {
  floor: 0x9fb0c4,
  platform: 0x5f7391,
  wall: 0x7b8aa3,
  step: 0x8fa2bd,
  gold: 0xffc83d,
  green: 0x67d17a,
  wood: 0xb07a4a,
  soil: 0x8a6b4b,
  brick: 0xa2594a,
} as const;

const DEFAULT_FRICTION = 0.6;
const DEFAULT_BALL_RADIUS = 0.35;
const DEFAULT_BALL_MASS = 1.2;
const DEFAULT_BALL_RESTITUTION = 0.45;
const DEFAULT_BALL_FRICTION = 0.4;
const DEFAULT_CRATE_SIZE = 0.9;
const DEFAULT_CRATE_MASS = 2;

/**
 * Constructor de niveles.
 *
 * Cada llamada crea la geometría visual Y su colisionador de físicas en el
 * mismo sitio, de modo que la malla y el collider nunca pueden separarse.
 *
 * Todas las coordenadas son LOCALES a la arena: el builder suma `LEVEL_ORIGIN`
 * a cada posición (malla, collider y registro lógico).
 *
 * La base de los volúmenes lógicos (meta, zona objetivo, checkpoint) es su
 * centro inferior: `(x, y, z)` es el suelo de la caja y la caja sube `h`.
 */
export class LevelBuilder {
  /** Fichas del nivel en coordenadas de mundo. */
  public readonly collectibles: CollectibleInfo[] = [];
  /** Zonas objetivo (porterías) en coordenadas de mundo. */
  public readonly targetZones: TargetZoneInfo[] = [];
  /** Zonas de meta (arco de salida) en coordenadas de mundo. */
  public readonly goalZones: GoalZoneInfo[] = [];
  /** Puntos de reaparición en coordenadas de mundo. */
  public readonly checkpoints: THREE.Vector3[] = [];
  /** Cuerpos dinámicos creados por el nivel. */
  public readonly bodies: RigidBody[] = [];

  private readonly group: THREE.Group;
  private readonly world: PhysicsWorld;
  private readonly levelId: string;
  private readonly origin: THREE.Vector3;
  private readonly staticIds: string[] = [];
  private readonly bodyIds: string[] = [];
  private readonly meshes: THREE.Object3D[] = [];
  private readonly geometries: THREE.BufferGeometry[] = [];
  private readonly materials: THREE.Material[] = [];
  private readonly materialCache = new Map<string, THREE.MeshStandardMaterial>();
  private counter = 0;
  private animationTime = 0;

  constructor(group: THREE.Group, world: PhysicsWorld, levelId: string) {
    this.group = group;
    this.world = world;
    this.levelId = levelId;
    this.origin = LEVEL_ORIGIN.clone();
  }

  // ---------------------------------------------------------------------------
  // Utilidades internas
  // ---------------------------------------------------------------------------

  private toWorld(x: number, y: number, z: number): THREE.Vector3 {
    return new THREE.Vector3(x, y, z).add(this.origin);
  }

  private nextId(kind: string): string {
    this.counter += 1;
    return `${this.levelId}_${kind}_${this.counter}`;
  }

  private trackMesh(mesh: THREE.Object3D): void {
    this.meshes.push(mesh);
    this.group.add(mesh);
  }

  private standardMaterial(
    color: number,
    roughness: number,
    metalness: number,
    emissive = 0x000000,
  ): THREE.MeshStandardMaterial {
    const key = `${color}|${roughness}|${metalness}|${emissive}`;
    const cached = this.materialCache.get(key);
    if (cached) return cached;

    const material = new THREE.MeshStandardMaterial({
      color,
      roughness,
      metalness,
      emissive,
      emissiveIntensity: emissive === 0x000000 ? 0 : 0.7,
    });
    this.materialCache.set(key, material);
    this.materials.push(material);
    return material;
  }

  private trackGeometry(geometry: THREE.BufferGeometry): THREE.BufferGeometry {
    this.geometries.push(geometry);
    return geometry;
  }

  // ---------------------------------------------------------------------------
  // Geometría estática
  // ---------------------------------------------------------------------------

  /** Caja alineada con los ejes: malla + colisionador de caja. */
  public box(o: LevelBoxOptions): THREE.Mesh {
    const geometry = this.trackGeometry(new THREE.BoxGeometry(o.w, o.h, o.d));
    const material = this.standardMaterial(
      o.color ?? LEVEL_COLORS.platform,
      o.roughness ?? 0.85,
      o.metalness ?? 0.05,
      o.emissive ?? 0x000000,
    );
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.copy(this.toWorld(o.x, o.y, o.z));
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    this.trackMesh(mesh);

    const id = this.nextId('box');
    this.world.addStaticBox(this.toWorld(o.x, o.y, o.z), new THREE.Vector3(o.w / 2, o.h / 2, o.d / 2), {
      id,
      friction: o.friction ?? DEFAULT_FRICTION,
      restitution: o.restitution ?? 0,
      tag: 'level-static',
    });
    this.staticIds.push(id);
    return mesh;
  }

  /** Cilindro: malla + colisionador de caja (el motor solo soporta cajas y esferas). */
  public cylinder(o: LevelCylinderOptions): THREE.Mesh {
    const geometry = this.trackGeometry(new THREE.CylinderGeometry(o.r, o.r, o.h, 20));
    const material = this.standardMaterial(o.color ?? LEVEL_COLORS.wall, 0.8, o.metalness ?? 0.05);
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.copy(this.toWorld(o.x, o.y, o.z));
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    this.trackMesh(mesh);

    const id = this.nextId('cylinder');
    this.world.addStaticBox(this.toWorld(o.x, o.y, o.z), new THREE.Vector3(o.r, o.h / 2, o.r), {
      id,
      friction: DEFAULT_FRICTION,
      restitution: 0,
      tag: 'level-static',
    });
    this.staticIds.push(id);
    return mesh;
  }

  /** Esfera estática: malla + colisionador de esfera. */
  public sphere(o: LevelSphereOptions): THREE.Mesh {
    const geometry = this.trackGeometry(new THREE.SphereGeometry(o.r, 20, 14));
    const material = this.standardMaterial(o.color ?? LEVEL_COLORS.green, 0.6, o.metalness ?? 0.1);
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.copy(this.toWorld(o.x, o.y, o.z));
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    this.trackMesh(mesh);

    const id = this.nextId('sphere');
    this.world.addStaticSphere(this.toWorld(o.x, o.y, o.z), o.r, {
      id,
      friction: 0.5,
      restitution: 0.3,
      tag: 'level-static',
    });
    this.staticIds.push(id);
    return mesh;
  }

  /** Caja puramente decorativa (sin colisionador), p. ej. el suelo de la muerte. */
  public visualBox(o: LevelBoxOptions): THREE.Mesh {
    const geometry = this.trackGeometry(new THREE.BoxGeometry(o.w, o.h, o.d));
    const material = this.standardMaterial(
      o.color ?? LEVEL_COLORS.floor,
      o.roughness ?? 0.9,
      o.metalness ?? 0,
      o.emissive ?? 0x000000,
    );
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.copy(this.toWorld(o.x, o.y, o.z));
    mesh.castShadow = false;
    mesh.receiveShadow = true;
    this.trackMesh(mesh);
    return mesh;
  }

  // ---------------------------------------------------------------------------
  // Cuerpos dinámicos
  // ---------------------------------------------------------------------------

  /** Pelota dinámica: rueda y bota. */
  public ball(o: LevelBallOptions): THREE.Mesh {
    const radius = o.r ?? DEFAULT_BALL_RADIUS;
    const geometry = this.trackGeometry(new THREE.SphereGeometry(radius, 24, 18));
    const material = this.standardMaterial(0xe4573d, 0.45, 0.08);
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.copy(this.toWorld(o.x, o.y, o.z));
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    this.trackMesh(mesh);

    const id = this.nextId('ball');
    const body = this.world.addBody({
      id,
      shape: 'sphere',
      position: this.toWorld(o.x, o.y, o.z),
      radius,
      mass: o.mass ?? DEFAULT_BALL_MASS,
      restitution: o.restitution ?? DEFAULT_BALL_RESTITUTION,
      friction: o.friction ?? DEFAULT_BALL_FRICTION,
      mesh,
      tag: 'level-ball',
    });
    this.bodies.push(body);
    this.bodyIds.push(id);
    return mesh;
  }

  /** Caja dinámica (cajón) que el jugador puede empujar. */
  public crate(o: LevelCrateOptions): THREE.Mesh {
    const size = o.size ?? DEFAULT_CRATE_SIZE;
    const geometry = this.trackGeometry(new THREE.BoxGeometry(size, size, size));
    const material = this.standardMaterial(LEVEL_COLORS.wood, 0.9, 0.02);
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.copy(this.toWorld(o.x, o.y, o.z));
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    this.trackMesh(mesh);

    const id = this.nextId('crate');
    const body = this.world.addBody({
      id,
      shape: 'box',
      position: this.toWorld(o.x, o.y, o.z),
      half: new THREE.Vector3(size / 2, size / 2, size / 2),
      mass: o.mass ?? DEFAULT_CRATE_MASS,
      restitution: 0.05,
      friction: 0.6,
      mesh,
      tag: 'level-crate',
    });
    this.bodies.push(body);
    this.bodyIds.push(id);
    return mesh;
  }

  // ---------------------------------------------------------------------------
  // Elementos de juego
  // ---------------------------------------------------------------------------

  /** Ficha dorada coleccionable. */
  public collectible(o: { x: number; y: number; z: number }): void {
    const position = this.toWorld(o.x, o.y, o.z);
    const geometry = this.trackGeometry(new THREE.CylinderGeometry(0.3, 0.3, 0.09, 24));
    const material = this.standardMaterial(LEVEL_COLORS.gold, 0.25, 0.9, 0xffa500);
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.copy(position);
    mesh.castShadow = true;
    this.trackMesh(mesh);

    this.collectibles.push({
      id: this.nextId('coin'),
      position,
      mesh,
      collected: false,
    });
  }

  /**
   * Arco de meta visible (dos postes + dintel) y su volumen lógico de salida.
   * El volumen no se registra como colisionador: un trigger estático alteraría
   * el raycast de suelo del controlador del personaje.
   */
  public goal(o: LevelGoalOptions): void {
    const postWidth = 0.4;
    const postOffset = o.w / 2 + postWidth / 2;

    for (const side of [-1, 1]) {
      const geometry = this.trackGeometry(new THREE.BoxGeometry(postWidth, o.h, postWidth));
      const material = this.standardMaterial(LEVEL_COLORS.green, 0.6, 0.15);
      const post = new THREE.Mesh(geometry, material);
      post.position.copy(this.toWorld(o.x + side * postOffset, o.y + o.h / 2, o.z));
      post.castShadow = true;
      post.receiveShadow = true;
      this.trackMesh(post);
    }

    const lintelGeometry = this.trackGeometry(new THREE.BoxGeometry(o.w + postWidth * 2 + 0.2, 0.45, postWidth + 0.1));
    const lintelMaterial = this.standardMaterial(LEVEL_COLORS.gold, 0.35, 0.75, 0x663300);
    const lintel = new THREE.Mesh(lintelGeometry, lintelMaterial);
    lintel.position.copy(this.toWorld(o.x, o.y + o.h + 0.22, o.z));
    lintel.castShadow = true;
    this.trackMesh(lintel);

    const triggerGeometry = this.trackGeometry(new THREE.BoxGeometry(o.w, o.h, o.d));
    const triggerMaterial = new THREE.MeshBasicMaterial({
      color: LEVEL_COLORS.green,
      transparent: true,
      opacity: 0.22,
      depthWrite: false,
    });
    this.materials.push(triggerMaterial);
    const trigger = new THREE.Mesh(triggerGeometry, triggerMaterial);
    trigger.position.copy(this.toWorld(o.x, o.y + o.h / 2, o.z));
    this.trackMesh(trigger);

    this.goalZones.push({
      center: this.toWorld(o.x, o.y + o.h / 2, o.z),
      half: new THREE.Vector3(o.w / 2, o.h / 2, o.d / 2),
      label: o.label,
    });
  }

  /** Zona donde se cuentan los cuerpos dinámicos empujados (portería, corral...). */
  public targetZone(o: LevelTargetZoneOptions): void {
    const geometry = this.trackGeometry(new THREE.BoxGeometry(o.w, o.h, o.d));
    const material = new THREE.MeshBasicMaterial({
      color: 0x53d1ff,
      transparent: true,
      opacity: 0.25,
      depthWrite: false,
    });
    this.materials.push(material);
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.copy(this.toWorld(o.x, o.y + o.h / 2, o.z));
    this.trackMesh(mesh);

    this.targetZones.push({
      id: o.id,
      center: this.toWorld(o.x, o.y + o.h / 2, o.z),
      half: new THREE.Vector3(o.w / 2, o.h / 2, o.d / 2),
    });
  }

  /** Punto de reaparición (checkpoint). */
  public checkpoint(o: LevelCheckpointOptions): void {
    const geometry = this.trackGeometry(new THREE.CylinderGeometry(0.7, 0.7, 0.08, 24));
    const material = this.standardMaterial(0x53d1ff, 0.4, 0.4, 0x0b3a4a);
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.copy(this.toWorld(o.x, o.y + 0.04, o.z));
    this.trackMesh(mesh);

    this.checkpoints.push(this.toWorld(o.x, o.y, o.z));
  }

  // ---------------------------------------------------------------------------
  // Ciclo de vida
  // ---------------------------------------------------------------------------

  /** Anima las fichas (giro lento + flotación). */
  public update(delta: number): void {
    this.animationTime += delta;
    for (const collectible of this.collectibles) {
      if (collectible.collected) continue;
      collectible.mesh.rotation.y += delta * 1.8;
      collectible.mesh.position.y =
        collectible.position.y + Math.sin(this.animationTime * 2 + collectible.position.x) * 0.09;
    }
  }

  /** Elimina todo lo creado por el builder del mundo de físicas y de la escena. */
  public dispose(): void {
    for (const id of this.staticIds) this.world.removeStatic(id);
    for (const id of this.bodyIds) this.world.removeBody(id);
    this.staticIds.length = 0;
    this.bodyIds.length = 0;

    for (const mesh of this.meshes) this.group.remove(mesh);
    this.meshes.length = 0;

    for (const geometry of this.geometries) geometry.dispose();
    this.geometries.length = 0;

    for (const material of this.materials) material.dispose();
    this.materials.length = 0;
    this.materialCache.clear();

    this.collectibles.length = 0;
    this.targetZones.length = 0;
    this.goalZones.length = 0;
    this.checkpoints.length = 0;
    this.bodies.length = 0;
  }
}
