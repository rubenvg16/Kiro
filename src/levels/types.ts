import * as THREE from 'three';
import type { PhysicsWorld } from '../core/physics/PhysicsWorld';
import type { LevelBuilder } from './LevelBuilder';

/**
 * Centro de las arenas de niveles.
 *
 * El patio escolar libre ocupa la zona (-36..36, -36..36) alrededor del origen.
 * Las arenas de la campaña se construyen muy lejos para que ambos escenarios
 * convivan en el mismo mundo de físicas sin colisionar entre sí.
 */
export const LEVEL_ORIGIN = new THREE.Vector3(200, 0, 200);

export type LevelDifficulty = 'facil' | 'media' | 'dificil';

export type UniqueMechanic =
  | 'timed_platforming'
  | 'gravity_inversion'
  | 'magnetic_blocks'
  | 'fog_of_war'
  | 'mirror_rooms'
  | 'ice_surfaces'
  | 'wind_gusts';

export type DifficultyTier = 'explorador' | 'investigador' | 'maestro';

export interface LevelObjective {
  /** Número de fichas que hay que recoger (0 = ninguna). */
  collect: number;
  /** El jugador debe entrar en la zona de meta. */
  reach: boolean;
  /** Hay que empujar N cuerpos dinámicos dentro de la zona objetivo. */
  physics: { count: number; targetId: string } | null;
}

export interface LevelRewards {
  xp: number;
  coins: number;
}

export interface LevelDefinition {
  id: string;
  name: string;
  description: string;
  difficulty: LevelDifficulty;
  tier?: DifficultyTier;
  uniqueMechanic?: UniqueMechanic;
  mechanicHint?: string;
  parTimeSeconds: number;
  rewards: LevelRewards;
  /** Punto de aparición en coordenadas LOCALES de la arena. */
  spawn: THREE.Vector3;
  objective: LevelObjective;
  hasHybridGate?: boolean;
  isChallengeVariant?: boolean;
  build(ctx: LevelBuildContext): void;
}

export interface LevelBuildContext {
  scene: THREE.Scene;
  world: PhysicsWorld;
  /** Grupo de la escena donde se cuelga toda la geometría del nivel. */
  group: THREE.Group;
  builder: LevelBuilder;
  levelId: string;
}

export interface LevelRuntimeState {
  levelId: string;
  name: string;
  /** Texto legible del objetivo, p. ej. "Recoge 4 fichas y llega a la meta". */
  objectiveText: string;
  collected: number;
  collectTotal: number;
  physicsCurrent: number;
  physicsTotal: number;
  elapsedSeconds: number;
  stars: number;
  completed: boolean;
}

export interface LevelResult {
  levelId: string;
  name: string;
  stars: number;
  timeSeconds: number;
  bestTimeSeconds: number | null;
  isNewBest: boolean;
  xp: number;
  coins: number;
}
