import * as THREE from 'three';
import { LEVEL_COLORS } from '../LevelBuilder';
import type { LevelDefinition } from '../types';

/**
 * Nivel 1 - "Primer día en el patio".
 *
 * Enseña a moverse, correr, saltar y subir escalones. Todo el recorrido es
 * alcanzable con escalones de 0.4 m (altura de escalón del controlador: 0.45 m).
 */
export const PATIO_LEVEL: LevelDefinition = {
  id: 'patio_primer_dia',
  name: 'Primer día en el patio',
  description:
    'Tu primer recreo en el instituto: recorre el patio, sube las escaleras y recoge todas las fichas antes de llegar a la meta.',
  difficulty: 'facil',
  parTimeSeconds: 60,
  rewards: { xp: 80, coins: 30 },
  spawn: new THREE.Vector3(0, 0.1, -11),
  objective: { collect: 6, reach: true, physics: null },
  build(ctx) {
    const { builder } = ctx;

    // Suelo del patio: la superficie superior queda en y = 0.
    builder.box({ x: 0, y: -0.5, z: 0, w: 30, h: 1, d: 30, color: LEVEL_COLORS.floor, roughness: 0.95 });

    // Muro perimetral bajo (cara interior en ±15).
    builder.box({ x: -15.2, y: 1, z: 0, w: 0.4, h: 2, d: 30.8, color: LEVEL_COLORS.wall });
    builder.box({ x: 15.2, y: 1, z: 0, w: 0.4, h: 2, d: 30.8, color: LEVEL_COLORS.wall });
    builder.box({ x: 0, y: 1, z: -15.2, w: 30.8, h: 2, d: 0.4, color: LEVEL_COLORS.wall });
    builder.box({ x: 0, y: 1, z: 15.2, w: 30.8, h: 2, d: 0.4, color: LEVEL_COLORS.wall });

    // Escalera de 3 peldaños de 0.4 m (topes en 0.4, 0.8 y 1.2).
    builder.box({ x: -6, y: 0.2, z: 0, w: 3, h: 0.4, d: 3, color: LEVEL_COLORS.step });
    builder.box({ x: -3, y: 0.4, z: 0, w: 3, h: 0.8, d: 3, color: LEVEL_COLORS.step });
    builder.box({ x: 0, y: 0.6, z: 0, w: 3, h: 1.2, d: 3, color: LEVEL_COLORS.step });

    // Plataforma a 1.6 m: se llega desde el peldaño 3 (desnivel de 0.4 m).
    builder.box({ x: 4.5, y: 0.8, z: 0, w: 6, h: 1.6, d: 3, color: LEVEL_COLORS.platform });

    // Bloque de 1.2 m con una ficha encima.
    builder.box({ x: 10, y: 0.6, z: 0, w: 2, h: 1.2, d: 2, color: LEVEL_COLORS.brick });

    // Jardineras decorativas.
    builder.box({ x: -11, y: 0.3, z: 9, w: 2.4, h: 0.6, d: 2.4, color: LEVEL_COLORS.green });
    builder.box({ x: 11, y: 0.3, z: -9, w: 2.4, h: 0.6, d: 2.4, color: LEVEL_COLORS.green });

    // 6 fichas: 3 en el suelo, 2 en la plataforma y 1 en el bloque alto.
    builder.collectible({ x: -9, y: 0.9, z: -6 });
    builder.collectible({ x: -4, y: 0.9, z: 6 });
    builder.collectible({ x: 7, y: 0.9, z: -8 });
    builder.collectible({ x: 3.2, y: 2.5, z: 0 });
    builder.collectible({ x: 5.8, y: 2.5, z: 0 });
    builder.collectible({ x: 10, y: 2.1, z: 0 });

    // Arco de meta al fondo del patio.
    builder.goal({ x: 0, y: 0, z: 11, w: 3, h: 3, d: 0.8, label: 'Meta' });
  },
};
