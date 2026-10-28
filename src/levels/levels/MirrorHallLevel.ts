import * as THREE from 'three';
import { LEVEL_COLORS } from '../LevelBuilder';
import type { LevelDefinition } from '../types';

export const MIRROR_HALL_LEVEL: LevelDefinition = {
  id: 'pasillo_espejos',
  name: 'Pasillo de los Espejos',
  description: 'Un laberinto de paredes de cristal reflectante donde deberás distinguir el camino real de los reflejos ópticos.',
  difficulty: 'media',
  tier: 'investigador',
  uniqueMechanic: 'mirror_rooms',
  mechanicHint: 'Sala de espejos: las superficies de cristal reflejan la luz y pueden ocultar pasos secretos.',
  parTimeSeconds: 120,
  rewards: { xp: 220, coins: 85 },
  spawn: new THREE.Vector3(0, 0.1, -11),
  objective: { collect: 6, reach: true, physics: null },
  build(ctx) {
    const { builder } = ctx;

    // Suelo reflectante
    builder.box({ x: 0, y: -0.5, z: 0, w: 26, h: 1, d: 26, color: 0x1e293b, roughness: 0.1, metalness: 0.8 });

    // Paredes de espejo laberínticas
    builder.box({ x: -6, y: 1.5, z: -3, w: 0.3, h: 3, d: 12, color: 0xe2e8f0, roughness: 0.05, metalness: 0.95 });
    builder.box({ x: 6, y: 1.5, z: 3, w: 0.3, h: 3, d: 12, color: 0xe2e8f0, roughness: 0.05, metalness: 0.95 });
    builder.box({ x: 0, y: 1.5, z: 0, w: 8, h: 3, d: 0.3, color: 0xe2e8f0, roughness: 0.05, metalness: 0.95 });

    // Fichas ocultas tras los cristales
    builder.collectible({ x: -8, y: 0.9, z: -4 });
    builder.collectible({ x: -8, y: 0.9, z: 4 });
    builder.collectible({ x: 8, y: 0.9, z: -4 });
    builder.collectible({ x: 8, y: 0.9, z: 4 });
    builder.collectible({ x: 0, y: 0.9, z: -6 });
    builder.collectible({ x: 0, y: 0.9, z: 6 });

    // Meta
    builder.goal({ x: 0, y: 0, z: 10, w: 3, h: 3, d: 0.8, label: 'Salida del Laberinto' });
  }
};
