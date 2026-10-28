import * as THREE from 'three';
import { LEVEL_COLORS } from '../LevelBuilder';
import type { LevelDefinition } from '../types';

export const ZERO_GRAVITY_LEVEL: LevelDefinition = {
  id: 'sala_gravedad_cero',
  name: 'Sala de Gravedad Cero',
  description: 'Experimenta la inversión gravitatoria: salta entre el techo magnético y las pasarelas flotantes.',
  difficulty: 'media',
  tier: 'investigador',
  uniqueMechanic: 'gravity_inversion',
  mechanicHint: 'Inversión de gravedad: los campos cuánticos alteran la verticalidad del salto.',
  parTimeSeconds: 110,
  rewards: { xp: 200, coins: 80 },
  spawn: new THREE.Vector3(0, 0.1, -10),
  objective: { collect: 5, reach: true, physics: null },
  build(ctx) {
    const { builder } = ctx;

    // Suelo base y techo suspendido
    builder.box({ x: 0, y: -0.5, z: 0, w: 24, h: 1, d: 24, color: 0x334155 });
    builder.emissivePlatform({ x: 0, y: 7.5, z: 0, w: 24, h: 1, d: 24, color: 0x4f46e5, emissive: 0x312e81 });

    // Pasarelas flotantes intermedias
    builder.emissivePlatform({ x: -4, y: 2.0, z: -4, w: 5, h: 0.6, d: 3, color: 0x818cf8, emissive: 0x4338ca });
    builder.emissivePlatform({ x: 4, y: 3.5, z: 0, w: 5, h: 0.6, d: 3, color: 0x818cf8, emissive: 0x4338ca });
    builder.emissivePlatform({ x: -3, y: 5.0, z: 4, w: 5, h: 0.6, d: 3, color: 0x818cf8, emissive: 0x4338ca });

    // Fichas flotantes
    builder.collectible({ x: -4, y: 2.8, z: -4 });
    builder.collectible({ x: 4, y: 4.3, z: 0 });
    builder.collectible({ x: -3, y: 5.8, z: 4 });
    builder.collectible({ x: 0, y: 0.9, z: 0 });
    builder.collectible({ x: 6, y: 0.9, z: -6 });

    // Checkpoint
    builder.checkpoint({ x: 4, y: 3.8, z: 0 });

    // Meta final
    builder.goal({ x: 0, y: 0, z: 9, w: 3, h: 3, d: 0.8, label: 'Cámara Antigravitatoria' });
  }
};
