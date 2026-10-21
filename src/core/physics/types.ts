import type * as THREE from 'three';

/** Supported primitive shapes for colliders. */
export type ColliderShape = 'box' | 'sphere';

/** Properties shared by every collider. */
export interface ColliderBase {
  id: string;
  shape: ColliderShape;
  /** Surface friction coefficient, 0..1. */
  friction: number;
  /** Bounciness coefficient, 0..1. */
  restitution: number;
  /** Triggers report overlap events but never push bodies. */
  isTrigger: boolean;
  /** Free-form label for gameplay code. */
  tag: string;
  /** Free-form payload for gameplay code. */
  userData: unknown;
}

/** Axis-aligned box collider. `half` holds the half-extents (full size / 2). */
export interface BoxCollider extends ColliderBase {
  shape: 'box';
  center: THREE.Vector3;
  half: THREE.Vector3;
}

/** Sphere collider. */
export interface SphereCollider extends ColliderBase {
  shape: 'sphere';
  center: THREE.Vector3;
  radius: number;
}

/** Immutable world geometry. */
export type StaticCollider = BoxCollider | SphereCollider;

/** A dynamic body simulated by the world. */
export interface RigidBody {
  id: string;
  shape: ColliderShape;
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  rotation: THREE.Quaternion;
  angularVelocity: THREE.Vector3;
  /** Box only: half-extents. */
  half: THREE.Vector3;
  /** Sphere only: radius. */
  radius: number;
  mass: number;
  inverseMass: number;
  friction: number;
  restitution: number;
  linearDamping: number;
  gravityScale: number;
  sleeping: boolean;
  tag: string;
  userData: unknown;
  /** Optional visual representation, synced after every integration step. */
  mesh?: THREE.Object3D;
}

/** Result of a successful raycast against world geometry. */
export interface RaycastHit {
  point: THREE.Vector3;
  normal: THREE.Vector3;
  distance: number;
  collider: StaticCollider;
}
