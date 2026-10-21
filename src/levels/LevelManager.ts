import * as THREE from 'three';
import type { PhysicsWorld } from '../core/physics/PhysicsWorld';
import { ProgressionManager } from '../gamification/ProgressionManager';
import { CampaignProgressStore } from '../gamification/CampaignProgress';
import type { CampaignProgress } from '../gamification/CampaignProgress';
import { LevelBuilder } from './LevelBuilder';
import { LEVELS } from './levels/index';
import { LEVEL_ORIGIN } from './types';
import type { LevelDefinition, LevelObjective, LevelResult, LevelRuntimeState } from './types';

/** Radio del personaje (el mismo que usa el controlador de físicas). */
const PLAYER_RADIUS = 0.35;
/** Margen extra de alcance del empujón. */
const PUSH_MARGIN = 0.15;
/** Factor de velocidad: el cuerpo empujado va algo más rápido que el jugador. */
const PUSH_SPEED_FACTOR = 1.1;
/** Suavizado del empujón por frame (a 60 fps). */
const PUSH_BLEND = 0.25;
/** Masa de referencia: un cuerpo más pesado acelera menos. */
const REFERENCE_MASS = 1.2;
/** Velocidad máxima a la que se puede empujar un cuerpo. */
const MAX_PUSH_SPEED = 14;
/** Distancia de recogida de una ficha. */
const PICKUP_RADIUS = 1.2;
/** Intervalo mínimo entre emissions de progreso (evita saturar el DOM). */
const PROGRESS_EMIT_INTERVAL = 0.2;
/** Altura por debajo de la cual el jugador debe reaparecer. */
const KILL_PLANE_Y = -3;
/** Radio horizontal de activación de un checkpoint. */
const CHECKPOINT_RADIUS = 2.2;
/** Margen de la zona de meta (absorbe el error de posición de los pies). */
const GOAL_TOLERANCE = new THREE.Vector3(0.25, 0.4, 0.25);

function pluralize(count: number, singular: string, plural: string): string {
  return count === 1 ? singular : plural;
}

/** Texto legible del objetivo de un nivel. */
export function buildObjectiveText(objective: LevelObjective): string {
  const parts: string[] = [];
  if (objective.collect > 0) {
    parts.push(`Recoge ${objective.collect} ${pluralize(objective.collect, 'ficha', 'fichas')}`);
  }
  if (objective.physics && objective.physics.count > 0) {
    parts.push(
      `Empuja ${objective.physics.count} ${pluralize(objective.physics.count, 'cuerpo', 'cuerpos')} a la zona`,
    );
  }
  if (objective.reach) parts.push('llega a la meta');
  return parts.length > 0 ? parts.join(' y ') : 'Completa el reto';
}

/**
 * Gestiona la campaña de niveles: carga, descarga, progreso, objetivos y
 * recompensas. Es la única clase que habla con `ProgressionManager` y con el
 * almacenamiento de la campaña.
 */
export class LevelManager {
  public onLevelStart: ((level: LevelDefinition) => void) | null = null;
  public onLevelProgress: ((state: LevelRuntimeState) => void) | null = null;
  public onLevelComplete: ((result: LevelResult) => void) | null = null;
  public onHint: ((message: string) => void) | null = null;
  public onRespawnRequested: ((position: THREE.Vector3) => void) | null = null;

  private readonly scene: THREE.Scene;
  private readonly world: PhysicsWorld;
  private readonly levelOrder: string[];
  private progress: CampaignProgress;
  private group: THREE.Group | null = null;
  private builder: LevelBuilder | null = null;
  private current: LevelDefinition | null = null;
  private state: LevelRuntimeState | null = null;
  private collected = 0;
  private physicsCurrent = 0;
  private elapsed = 0;
  private stars = 0;
  private completed = false;
  private spawnWorld = LEVEL_ORIGIN.clone();
  private lastCheckpoint: THREE.Vector3 | null = null;
  private previousPlayerPosition: THREE.Vector3 | null = null;
  private playerVelocity = new THREE.Vector3();
  private progressTimer = 0;
  private awaitingRespawn = false;

  constructor(scene: THREE.Scene, world: PhysicsWorld) {
    this.scene = scene;
    this.world = world;
    this.levelOrder = LEVELS.map((level) => level.id);
    this.progress = CampaignProgressStore.load();
  }

  // ---------------------------------------------------------------------------
  // Estado público
  // ---------------------------------------------------------------------------

  public get levels(): readonly LevelDefinition[] {
    return LEVELS;
  }

  public get currentLevel(): LevelDefinition | null {
    return this.current;
  }

  public get currentState(): LevelRuntimeState | null {
    return this.state;
  }

  /** Posición de aparición (en coordenadas de mundo) del nivel actual. */
  public getSpawnWorldPosition(): THREE.Vector3 {
    return this.spawnWorld.clone();
  }

  // ---------------------------------------------------------------------------
  // Ciclo de vida de los niveles
  // ---------------------------------------------------------------------------

  /** Carga un nivel. Devuelve false si no existe o si está bloqueado. */
  public loadLevel(id: string): boolean {
    const level = LEVELS.find((candidate) => candidate.id === id);
    if (!level) return false;
    if (!this.isUnlocked(id)) return false;

    this.unloadLevel();

    const group = new THREE.Group();
    group.name = `level_${id}`;
    this.scene.add(group);
    this.group = group;

    const builder = new LevelBuilder(group, this.world, id);
    this.builder = builder;

    try {
      level.build({ scene: this.scene, world: this.world, group, builder, levelId: id });
    } catch (error) {
      console.warn(`No se pudo construir el nivel "${id}":`, error);
      this.unloadLevel();
      return false;
    }

    this.current = level;
    this.collected = 0;
    this.physicsCurrent = 0;
    this.elapsed = 0;
    this.stars = 0;
    this.completed = false;
    this.progressTimer = 0;
    this.awaitingRespawn = false;
    this.previousPlayerPosition = null;
    this.playerVelocity.set(0, 0, 0);
    this.lastCheckpoint = null;
    this.spawnWorld = level.spawn.clone().add(LEVEL_ORIGIN);

    this.state = this.buildState();
    this.onLevelStart?.(level);
    this.onLevelProgress?.(this.state);
    return true;
  }

  /** Descarga el nivel actual y libera geometría, colisionadores y cuerpos. */
  public unloadLevel(): void {
    if (this.builder) {
      this.builder.dispose();
      this.builder = null;
    }
    if (this.group) {
      this.scene.remove(this.group);
      this.group = null;
    }
    this.current = null;
    this.state = null;
    this.collected = 0;
    this.physicsCurrent = 0;
    this.elapsed = 0;
    this.stars = 0;
    this.completed = false;
    this.lastCheckpoint = null;
    this.previousPlayerPosition = null;
    this.playerVelocity.set(0, 0, 0);
  }

  /** Reinicia el nivel actual desde cero. */
  public restart(): void {
    const id = this.current?.id;
    if (!id) return;
    this.loadLevel(id);
  }

  // ---------------------------------------------------------------------------
  // Consulta de progreso
  // ---------------------------------------------------------------------------

  public isUnlocked(id: string): boolean {
    return CampaignProgressStore.isUnlocked(this.progress, id, this.levelOrder);
  }

  public getStars(id: string): number {
    return this.progress.results[id]?.stars ?? 0;
  }

  public getBestTime(id: string): number | null {
    return this.progress.results[id]?.bestTimeSeconds ?? null;
  }

  // ---------------------------------------------------------------------------
  // Bucle de juego
  // ---------------------------------------------------------------------------

  /**
   * Actualiza el nivel activo.
   *
   * @param delta Segundos transcurridos desde el último frame.
   * @param playerPosition Posición del jugador (se interpreta como la base de
   *   los pies; las fichas y la meta se miden contra ese punto).
   */
  public update(delta: number, playerPosition: THREE.Vector3): void {
    const level = this.current;
    const builder = this.builder;
    if (!level || !builder) return;

    const safeDelta = Math.max(0, Math.min(delta, 0.1));

    this.updatePlayerVelocity(safeDelta, playerPosition);
    this.updateRespawn(playerPosition);
    this.updateCheckpoints(playerPosition);
    builder.update(safeDelta);

    if (!this.completed) {
      this.elapsed += safeDelta;
      this.updatePushables(safeDelta, playerPosition);
      this.updateCollectibles(playerPosition);
      this.updatePhysicsObjective();
      this.updateGoal(playerPosition);
    }

    this.progressTimer += safeDelta;
    if (this.progressTimer >= PROGRESS_EMIT_INTERVAL) {
      this.progressTimer = 0;
      this.emitProgress();
    }
  }

  // ---------------------------------------------------------------------------
  // Internos
  // ---------------------------------------------------------------------------

  private updatePlayerVelocity(delta: number, playerPosition: THREE.Vector3): void {
    if (!this.previousPlayerPosition) {
      this.previousPlayerPosition = playerPosition.clone();
      return;
    }
    if (delta <= 0) return;

    const dx = (playerPosition.x - this.previousPlayerPosition.x) / delta;
    const dz = (playerPosition.z - this.previousPlayerPosition.z) / delta;
    this.previousPlayerPosition.copy(playerPosition);

    // Suavizado para evitar ruido de la animación del avatar.
    this.playerVelocity.x += (dx - this.playerVelocity.x) * 0.5;
    this.playerVelocity.z += (dz - this.playerVelocity.z) * 0.5;
  }

  /** Pide reaparecer cuando el jugador cae por debajo del plano de muerte. */
  private updateRespawn(playerPosition: THREE.Vector3): void {
    if (playerPosition.y > KILL_PLANE_Y + 1) {
      this.awaitingRespawn = false;
      return;
    }
    if (playerPosition.y >= KILL_PLANE_Y) return;
    if (this.awaitingRespawn) return;
    this.awaitingRespawn = true;
    const target = this.lastCheckpoint ?? this.spawnWorld;
    this.onRespawnRequested?.(target.clone());
  }

  /** Recuerda el último checkpoint pisado. */
  private updateCheckpoints(playerPosition: THREE.Vector3): void {
    const builder = this.builder;
    if (!builder) return;
    for (const checkpoint of builder.checkpoints) {
      const dx = checkpoint.x - playerPosition.x;
      const dz = checkpoint.z - playerPosition.z;
      const dy = Math.abs(checkpoint.y - playerPosition.y);
      if (dx * dx + dz * dz <= CHECKPOINT_RADIUS * CHECKPOINT_RADIUS && dy <= 2) {
        this.lastCheckpoint = checkpoint.clone();
      }
    }
  }

  /**
   * Empuja los cuerpos dinámicos que el jugador tiene al lado.
   *
   * El controlador de personaje solo colisiona con geometría estática, así que
   * el empuje es manual: se aplica una aceleración horizontal en la dirección
   * de marcha, escalada por la masa del cuerpo y limitada a 14 m/s.
   */
  private updatePushables(delta: number, playerPosition: THREE.Vector3): void {
    const builder = this.builder;
    if (!builder) return;

    const speed = Math.hypot(this.playerVelocity.x, this.playerVelocity.z);
    if (speed < 0.2) return;

    const dirX = this.playerVelocity.x / speed;
    const dirZ = this.playerVelocity.z / speed;

    for (const body of builder.bodies) {
      const radius = body.shape === 'sphere' ? body.radius : body.half.length();
      const dx = body.position.x - playerPosition.x;
      const dz = body.position.z - playerPosition.z;
      const distance = Math.hypot(dx, dz);
      const reach = PLAYER_RADIUS + radius + PUSH_MARGIN;
      if (distance > reach) continue;

      // Impulso horizontal en la dirección de marcha: el cuerpo persigue la
      // velocidad del jugador (sensación de empujón continuo) y los cuerpos
      // más pesados responden más despacio.
      const targetSpeed = Math.min(speed * PUSH_SPEED_FACTOR, MAX_PUSH_SPEED);
      const desiredX = dirX * targetSpeed;
      const desiredZ = dirZ * targetSpeed;

      const massFactor = REFERENCE_MASS / Math.max(body.mass, 0.1);
      const blend = Math.min(1, PUSH_BLEND * massFactor * delta * 60);
      body.velocity.x += (desiredX - body.velocity.x) * blend;
      body.velocity.z += (desiredZ - body.velocity.z) * blend;

      const horizontalSpeed = Math.hypot(body.velocity.x, body.velocity.z);
      if (horizontalSpeed > MAX_PUSH_SPEED) {
        const scale = MAX_PUSH_SPEED / horizontalSpeed;
        body.velocity.x *= scale;
        body.velocity.z *= scale;
      }

      // Si el cuerpo queda metido dentro del avatar se lo empuja hacia fuera.
      const overlap = PLAYER_RADIUS + radius - distance;
      if (overlap > 0) {
        const awayX = distance > 0.001 ? dx / distance : -dirX;
        const awayZ = distance > 0.001 ? dz / distance : -dirZ;
        body.position.x += awayX * overlap;
        body.position.z += awayZ * overlap;
        if (body.mesh) body.mesh.position.copy(body.position);
      }
    }
  }

  /** Recoge las fichas que el jugador tiene al alcance de los pies. */
  private updateCollectibles(playerPosition: THREE.Vector3): void {
    const builder = this.builder;
    if (!builder) return;

    let changed = false;
    for (const collectible of builder.collectibles) {
      if (collectible.collected) continue;
      if (collectible.position.distanceTo(playerPosition) > PICKUP_RADIUS) continue;

      collectible.collected = true;
      collectible.mesh.visible = false;
      this.collected += 1;
      changed = true;
    }

    if (changed) {
      this.emitProgress();
      this.emitHintIfNeeded();
    }
  }

  /** Cuenta los cuerpos dinámicos que han entrado en la zona objetivo. */
  private updatePhysicsObjective(): void {
    const level = this.current;
    const builder = this.builder;
    if (!level || !builder) return;

    const objective = level.objective.physics;
    if (!objective) return;

    let count = 0;
    for (const body of builder.bodies) {
      const inside = builder.targetZones.some(
        (zone) =>
          zone.id === objective.targetId &&
          Math.abs(body.position.x - zone.center.x) <= zone.half.x &&
          Math.abs(body.position.y - zone.center.y) <= zone.half.y &&
          Math.abs(body.position.z - zone.center.z) <= zone.half.z,
      );
      if (inside) count += 1;
    }

    const capped = Math.min(count, objective.count);
    if (capped !== this.physicsCurrent) {
      this.physicsCurrent = capped;
      this.emitProgress();
      this.emitHintIfNeeded();
    }
  }

  /** Comprueba la llegada a la meta y completa el nivel si todo está hecho. */
  private updateGoal(playerPosition: THREE.Vector3): void {
    const level = this.current;
    const builder = this.builder;
    if (!level || !builder) return;

    const insideGoal = builder.goalZones.some(
      (zone) =>
        Math.abs(playerPosition.x - zone.center.x) <= zone.half.x + GOAL_TOLERANCE.x &&
        Math.abs(playerPosition.y - zone.center.y) <= zone.half.y + GOAL_TOLERANCE.y &&
        Math.abs(playerPosition.z - zone.center.z) <= zone.half.z + GOAL_TOLERANCE.z,
    );
    if (!insideGoal) return;

    const missing = this.missingObjectives();
    if (missing.length > 0) {
      this.onHint?.(missing.join(' y '));
      return;
    }

    this.completeLevel();
  }

  /** Lista de condiciones que faltan para completar el nivel. */
  private missingObjectives(): string[] {
    const level = this.current;
    if (!level) return [];
    const objective = level.objective;
    const missing: string[] = [];

    const missingCollect = objective.collect - this.collected;
    if (missingCollect > 0) {
      missing.push(
        `Te falta${missingCollect === 1 ? '' : 'n'} ${missingCollect} ${pluralize(
          missingCollect,
          'ficha',
          'fichas',
        )}`,
      );
    }

    if (objective.physics) {
      const missingBodies = objective.physics.count - this.physicsCurrent;
      if (missingBodies > 0) {
        missing.push(
          `Te falta${missingBodies === 1 ? '' : 'n'} ${missingBodies} ${pluralize(
            missingBodies,
            'cuerpo',
            'cuerpos',
          )}`,
        );
      }
    }

    return missing;
  }

  /** Pista corta cuando aún falta algo por hacer. */
  private emitHintIfNeeded(): void {
    const missing = this.missingObjectives();
    if (missing.length > 0) this.onHint?.(missing.join(' y '));
  }

  private completeLevel(): void {
    const level = this.current;
    if (!level || this.completed) return;

    this.completed = true;
    const par = level.parTimeSeconds;
    this.stars = this.elapsed <= par * 0.6 ? 3 : this.elapsed <= par ? 2 : 1;

    const progression = ProgressionManager.getInstance();
    progression.addXP(level.rewards.xp);
    progression.addCoins(level.rewards.coins);

    const { progress, isNewBest } = CampaignProgressStore.recordResult(
      this.progress,
      level.id,
      this.stars,
      this.elapsed,
    );
    this.progress = progress;

    // Desbloquea el siguiente nivel del orden.
    const index = this.levelOrder.indexOf(level.id);
    const nextId = index >= 0 ? this.levelOrder[index + 1] : undefined;
    if (nextId && !this.progress.unlocked.includes(nextId)) {
      this.progress.unlocked.push(nextId);
    }
    CampaignProgressStore.save(this.progress);

    const stored = this.progress.results[level.id];
    const result: LevelResult = {
      levelId: level.id,
      name: level.name,
      stars: this.stars,
      timeSeconds: this.elapsed,
      bestTimeSeconds: stored?.bestTimeSeconds ?? this.elapsed,
      isNewBest,
      xp: level.rewards.xp,
      coins: level.rewards.coins,
    };

    this.state = this.buildState();
    this.onLevelComplete?.(result);
    this.emitProgress();
  }

  private buildState(): LevelRuntimeState {
    const level = this.current;
    if (!level) {
      return {
        levelId: '',
        name: '',
        objectiveText: '',
        collected: 0,
        collectTotal: 0,
        physicsCurrent: 0,
        physicsTotal: 0,
        elapsedSeconds: 0,
        stars: 0,
        completed: false,
      };
    }
    return {
      levelId: level.id,
      name: level.name,
      objectiveText: buildObjectiveText(level.objective),
      collected: this.collected,
      collectTotal: level.objective.collect,
      physicsCurrent: this.physicsCurrent,
      physicsTotal: level.objective.physics?.count ?? 0,
      elapsedSeconds: this.elapsed,
      stars: this.stars,
      completed: this.completed,
    };
  }

  private emitProgress(): void {
    if (!this.current) return;
    this.state = this.buildState();
    this.onLevelProgress?.(this.state);
  }
}
