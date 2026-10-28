import * as THREE from 'three';
import { LEVEL_COLORS } from '../LevelBuilder';
import type { LevelDefinition } from '../types';

/**
 * Nivel 2 - "Fútbol sala: la portería".
 *
 * El jugador empuja pelotas (cuerpos dinámicos) hasta dos porterías con
 * boc pockets laterales para que la pelota quede atrapada dentro.
 */
export const FUTSAL_LEVEL: LevelDefinition = {
  id: 'pista_futbol_sala',
  name: 'Fútbol sala: la portería',
  description:
    'Empuja las pelotas hasta las porterías y marca dos goles. Vigila las barreras: los cajones también estorban.',
  difficulty: 'media',
  tier: 'explorador',
  uniqueMechanic: 'ice_surfaces',
  mechanicHint: 'Superficie pulida de baja fricción: calcula la inercia del balón y del avatar.',
  parTimeSeconds: 90,
  rewards: { xp: 120, coins: 50 },
  spawn: new THREE.Vector3(0, 0.1, -9),
  objective: { collect: 4, reach: true, physics: { count: 2, targetId: 'goal' } },
  build(ctx) {
    const { builder } = ctx;

    // Pista de 34 x 24 con la superficie en y = 0.
    builder.box({ x: 0, y: -0.5, z: 0, w: 34, h: 1, d: 24, color: LEVEL_COLORS.floor, roughness: 0.9 });

    // Muros perimetrales (caras interiores en x = ±17 y z = ±12).
    builder.box({ x: -17.2, y: 1.5, z: 0, w: 0.4, h: 3, d: 24.8, color: LEVEL_COLORS.wall });
    builder.box({ x: 17.2, y: 1.5, z: 0, w: 0.4, h: 3, d: 24.8, color: LEVEL_COLORS.wall });
    builder.box({ x: 0, y: 1.5, z: -12.2, w: 34.8, h: 3, d: 0.4, color: LEVEL_COLORS.wall });
    builder.box({ x: 0, y: 1.5, z: 12.2, w: 34.8, h: 3, d: 0.4, color: LEVEL_COLORS.wall });

    // Porterías: dos laterales por portería que atrapan la pelota dentro.
    for (const side of [-1, 1]) {
      const goalX = side * 15.75;
      builder.box({ x: goalX, y: 0.6, z: -2.2, w: 2.5, h: 1.2, d: 0.4, color: LEVEL_COLORS.green });
      builder.box({ x: goalX, y: 0.6, z: 2.2, w: 2.5, h: 1.2, d: 0.4, color: LEVEL_COLORS.green });
      // Travesaño decorativo (sin colisionador para no estorbar al salto).
      builder.visualBox({ x: goalX, y: 3.1, z: 0, w: 0.35, h: 0.35, d: 4.8, color: LEVEL_COLORS.gold });
      builder.targetZone({ id: 'goal', x: goalX, y: 0, z: 0, w: 4, h: 2.5, d: 2.5 });
    }

    // Cuatro barreras bajas (1.2 m) que crean ángulos sin cerrar el pasillo central.
    builder.box({ x: -8, y: 0.6, z: -5, w: 8, h: 1.2, d: 0.4, color: LEVEL_COLORS.step });
    builder.box({ x: -5.8, y: 0.6, z: -8, w: 0.4, h: 1.2, d: 6, color: LEVEL_COLORS.step });
    builder.box({ x: 8, y: 0.6, z: 5, w: 8, h: 1.2, d: 0.4, color: LEVEL_COLORS.step });
    builder.box({ x: 5.8, y: 0.6, z: 8, w: 0.4, h: 1.2, d: 6, color: LEVEL_COLORS.step });

    // Tres pelotas dinámicas en el centro de la pista.
    builder.ball({ x: -3, y: 0.35, z: 0, r: 0.35, mass: 1.2, restitution: 0.45, friction: 0.4 });
    builder.ball({ x: 0, y: 0.35, z: 2.5, r: 0.35, mass: 1.2, restitution: 0.45, friction: 0.4 });
    builder.ball({ x: 3, y: 0.35, z: -2.5, r: 0.35, mass: 1.2, restitution: 0.45, friction: 0.4 });

    // Dos cajones dinámicos que estorban el paso.
    builder.crate({ x: -6, y: 0.45, z: 2, size: 0.9, mass: 2 });
    builder.crate({ x: 6, y: 0.45, z: -2, size: 0.9, mass: 2 });

    // Cuatro fichas repartidas por la pista.
    builder.collectible({ x: -12, y: 0.9, z: 0 });
    builder.collectible({ x: 12, y: 0.9, z: 0 });
    builder.collectible({ x: 0, y: 0.9, z: -8 });
    builder.collectible({ x: 0, y: 0.9, z: 8 });

    // Salida del nivel.
    builder.goal({ x: 0, y: 0, z: 10, w: 3, h: 3, d: 0.8, label: 'Meta' });
  },
};
