import * as THREE from 'three';
import { LEVEL_COLORS } from '../LevelBuilder';
import type { LevelDefinition } from '../types';

export const FOG_GALLERY_LEVEL: LevelDefinition = {
  id: 'galeria_niebla',
  name: 'Galería de la Niebla',
  description: 'Avanza por la galería histórica cubierta por densa niebla donde solo las balizas de luz guían el camino.',
  difficulty: 'media',
  tier: 'investigador',
  uniqueMechanic: 'fog_of_war',
  mechanicHint: 'Niebla de guerra: la visibilidad es reducida; avanza de baliza en baliza emisiva.',
  parTimeSeconds: 125,
  rewards: { xp: 240, coins: 90 },
  spawn: new THREE.Vector3(0, 0.1, -12),
  objective: { collect: 5, reach: true, physics: null },
  build(ctx) {
    const { builder } = ctx;

    // Suelo de piedra antigua
    builder.box({ x: 0, y: -0.5, z: 0, w: 22, h: 1, d: 28, color: 0x475569 });

    // Balizas emisivas que iluminan la niebla
    builder.neonLightStrip({ x: -4, y: 0.2, z: -6, w: 1, h: 0.4, d: 1, emissive: 0xf59e0b });
    builder.neonLightStrip({ x: 4, y: 0.2, z: -1, w: 1, h: 0.4, d: 1, emissive: 0xf59e0b });
    builder.neonLightStrip({ x: -3, y: 0.2, z: 4, w: 1, h: 0.4, d: 1, emissive: 0xf59e0b });

    // Obstáculos y pedestales
    builder.box({ x: -2, y: 0.6, z: -2, w: 2, h: 1.2, d: 2, color: 0x334155 });
    builder.box({ x: 3, y: 0.8, z: 3, w: 3, h: 1.6, d: 3, color: 0x334155 });

    // Fichas
    builder.collectible({ x: -4, y: 1.0, z: -6 });
    builder.collectible({ x: 4, y: 1.0, z: -1 });
    builder.collectible({ x: -3, y: 1.0, z: 4 });
    builder.collectible({ x: 3, y: 2.2, z: 3 });
    builder.collectible({ x: 0, y: 0.9, z: 8 });

    // Meta
    builder.goal({ x: 0, y: 0, z: 11, w: 3, h: 3, d: 0.8, label: 'Portal Despejado' });
  }
};
