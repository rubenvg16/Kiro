import * as THREE from 'three';
import { LEVEL_COLORS } from '../LevelBuilder';
import type { LevelDefinition } from '../types';

/**
 * Nivel 3 - "Huerto de ciencias".
 *
 * El huerto tiene seis bancales de 0.5 m y una plataforma a 1.8 m. La ruta de
 * subida es un escalón estático de 0.9 m (salto de 0.9 m desde el suelo, muy
 * por debajo del ápice de 2.09 m del salto) y, opcionalmente, los bancales.
 */
export const HUERTO_LEVEL: LevelDefinition = {
  id: 'huerto_ciencias',
  name: 'Huerto de ciencias',
  description:
    'Trabaja el huerto de ciencias: aparta los cajones, salta a la plataforma y recoge todas las semillas.',
  difficulty: 'media',
  tier: 'explorador',
  uniqueMechanic: 'wind_gusts',
  mechanicHint: 'Ráfagas de viento del valle: vigila el balanceo para no caer de los bancales.',
  parTimeSeconds: 110,
  rewards: { xp: 150, coins: 60 },
  spawn: new THREE.Vector3(0, 0.1, 14),
  objective: { collect: 6, reach: true, physics: null },
  build(ctx) {
    const { builder } = ctx;

    // Terreno del huerto con la superficie en y = 0.
    builder.box({ x: 0, y: -0.5, z: 0, w: 32, h: 1, d: 32, color: LEVEL_COLORS.soil, roughness: 1 });

    // Seto perimetral (caras interiores en ±16).
    builder.box({ x: -16.2, y: 0.75, z: 0, w: 0.4, h: 1.5, d: 32.8, color: LEVEL_COLORS.green });
    builder.box({ x: 16.2, y: 0.75, z: 0, w: 0.4, h: 1.5, d: 32.8, color: LEVEL_COLORS.green });
    builder.box({ x: 0, y: 0.75, z: -16.2, w: 32.8, h: 1.5, d: 0.4, color: LEVEL_COLORS.green });
    builder.box({ x: 0, y: 0.75, z: 16.2, w: 32.8, h: 1.5, d: 0.4, color: LEVEL_COLORS.green });

    // Seis bancales de cultivo de 0.5 m en retícula 3 x 2.
    for (const bedX of [-9, 0, 9]) {
      for (const bedZ of [-4, 4]) {
        builder.box({ x: bedX, y: 0.25, z: bedZ, w: 5, h: 0.5, d: 4, color: LEVEL_COLORS.wood });
      }
    }

    // Escalón de 0.9 m y plataforma de 1.8 m (desnivel de 0.9 m, saltable).
    // El escalón deja 1.1 m de hueco con la plataforma: el jugador sube de un
    // salto de 0.9 m de alto mientras cruza el hueco.
    builder.box({ x: 0, y: 0.45, z: -7.9, w: 3, h: 0.9, d: 2, color: LEVEL_COLORS.step });
    builder.box({ x: 0, y: 0.9, z: -12, w: 8, h: 1.8, d: 4, color: LEVEL_COLORS.platform });

    // Tres cajones dinámicos: hay que apartarlos del paso.
    builder.crate({ x: -3.5, y: 0.45, z: -4, size: 0.9, mass: 2 });
    builder.crate({ x: 3.5, y: 0.45, z: -4, size: 0.9, mass: 2 });
    builder.crate({ x: -4, y: 0.45, z: 8, size: 0.9, mass: 2 });

    // Checkpoint a mitad de camino.
    builder.checkpoint({ x: 0, y: 0, z: 8 });

    // Seis fichas: tres en tierra y tres en la plataforma.
    builder.collectible({ x: -13, y: 0.9, z: -12 });
    builder.collectible({ x: 13, y: 0.9, z: -12 });
    builder.collectible({ x: 0, y: 0.9, z: 13 });
    builder.collectible({ x: -2.5, y: 2.7, z: -12 });
    builder.collectible({ x: 2.5, y: 2.7, z: -12 });
    builder.collectible({ x: 0, y: 2.7, z: -12.8 });

    // Meta sobre la plataforma.
    builder.goal({ x: 0, y: 1.8, z: -12, w: 3, h: 2.6, d: 0.8, label: 'Meta' });
  },
};
