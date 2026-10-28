import * as THREE from 'three';
import { LEVEL_COLORS } from '../LevelBuilder';
import type { LevelDefinition } from '../types';

/**
 * Nivel 5 - "La torre del reloj".
 *
 * Tres alturas encadenadas: base (y = 0), primer cuerpo (y = 1.8) y torre
 * (y = 3.4). Los desniveles son de 0.9 y 0.8 m, siempre por debajo del 70%
 * del ápice de salto del motor (1.46 m), y las huellas son estáticas porque el
 * personaje solo se apoya sobre geometría estática.
 */
export const RELOJ_LEVEL: LevelDefinition = {
  id: 'torre_reloj',
  name: 'La torre del reloj',
  description:
    'Sube los tres cuerpos de la torre del reloj, recoge las diez fichas y mete una pelota en el Corner del reloj.',
  difficulty: 'dificil',
  tier: 'explorador',
  uniqueMechanic: 'magnetic_blocks',
  mechanicHint: 'Engranajes y campos magnéticos: atrae los bloques para formar puentes estables.',
  parTimeSeconds: 150,
  rewards: { xp: 260, coins: 100 },
  spawn: new THREE.Vector3(0, 0.1, 6.5),
  objective: { collect: 10, reach: true, physics: { count: 1, targetId: 'goal' } },
  build(ctx) {
    const { builder } = ctx;

    // Base de la torre (superficie en y = 0).
    builder.box({ x: 0, y: -0.5, z: 0, w: 16, h: 1, d: 16, color: LEVEL_COLORS.floor, roughness: 0.95 });

    // Muros perimetrales de la base.
    builder.box({ x: -8.2, y: 1.25, z: 0, w: 0.4, h: 2.5, d: 16.8, color: LEVEL_COLORS.wall });
    builder.box({ x: 8.2, y: 1.25, z: 0, w: 0.4, h: 2.5, d: 16.8, color: LEVEL_COLORS.wall });
    builder.box({ x: 0, y: 1.25, z: -8.2, w: 16.8, h: 2.5, d: 0.4, color: LEVEL_COLORS.wall });
    builder.box({ x: 0, y: 1.25, z: 8.2, w: 16.8, h: 2.5, d: 0.4, color: LEVEL_COLORS.wall });

    // Segundo cuerpo: losa de 10 x 6 con la superficie en y = 1.8.
    builder.box({ x: 0, y: 1.6, z: 0, w: 10, h: 0.4, d: 6, color: LEVEL_COLORS.platform });

    // Escalón estático de 0.9 m para subir al segundo cuerpo (deja 0.45 m de
    // hueco con la losa para que la cápsula no nazca dentro de la losa).
    builder.box({ x: 0, y: 0.45, z: 4.7, w: 2.5, h: 0.9, d: 2.5, color: LEVEL_COLORS.step });

    // Pilar de 2.6 m para subir a la torre (0.8 m por encima de la losa).
    builder.box({ x: 0, y: 1.3, z: -4.25, w: 2, h: 2.6, d: 2, color: LEVEL_COLORS.step });

    // Tercer cuerpo: losa de 6 x 6 con la superficie en y = 3.4.
    builder.box({ x: 0, y: 3.2, z: -8, w: 6, h: 0.4, d: 6, color: LEVEL_COLORS.platform });

    // Corner del reloj: dos muros que forman el corral donde entra la pelota.
    builder.box({ x: 5.85, y: 0.6, z: -3.9, w: 4.5, h: 1.2, d: 0.4, color: LEVEL_COLORS.gold });
    builder.box({ x: 7.5, y: 0.6, z: -5.8, w: 0.4, h: 1.2, d: 3.4, color: LEVEL_COLORS.gold });
    builder.targetZone({ id: 'goal', x: 5.65, y: 0, z: -5.8, w: 3.3, h: 2, d: 3.4 });

    // Dos pelotas en la base para empujar al corner.
    builder.ball({ x: -2, y: 0.35, z: 5, r: 0.35, mass: 1.2, restitution: 0.45, friction: 0.4 });
    builder.ball({ x: -4.5, y: 0.35, z: 6, r: 0.35, mass: 1.2, restitution: 0.45, friction: 0.4 });

    // Dos checkpoints: en la base y en el segundo cuerpo.
    builder.checkpoint({ x: -6, y: 0, z: 4 });
    builder.checkpoint({ x: 0, y: 1.8, z: 0 });

    // Diez fichas: cuatro en la base, tres en el segundo cuerpo, tres en la torre.
    builder.collectible({ x: -6, y: 0.9, z: -2 });
    builder.collectible({ x: 6, y: 0.9, z: 2 });
    builder.collectible({ x: -3, y: 0.9, z: 7 });
    builder.collectible({ x: 2, y: 0.9, z: -7 });
    builder.collectible({ x: -3, y: 2.7, z: 1.5 });
    builder.collectible({ x: 3, y: 2.7, z: -1.5 });
    builder.collectible({ x: 0, y: 2.7, z: 2 });
    builder.collectible({ x: -2, y: 4.3, z: -9 });
    builder.collectible({ x: 2, y: 4.3, z: -9 });
    builder.collectible({ x: 0, y: 4.3, z: -6.5 });

    // Meta en lo alto de la torre.
    builder.goal({ x: 0, y: 3.4, z: -8, w: 3, h: 2.6, d: 0.8, label: 'Meta' });
  },
};
