import * as THREE from 'three';
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

    // Muros perimetrales (caras interiores en x = ±17 y z = ±12).

    // Porterías: dos laterales por portería que atrapan la pelota dentro.
    for (const side of [-1, 1]) {
      const goalX = side * 15.75;
      // Travesaño decorativo (sin colisionador para no estorbar al salto).
      builder.targetZone({ id: 'goal', x: goalX, y: 0, z: 0, w: 4, h: 2.5, d: 2.5 });
    }

    // Cuatro barreras bajas (1.2 m) que crean ángulos sin cerrar el pasillo central.

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
