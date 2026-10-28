import * as THREE from 'three';
import { LEVEL_COLORS } from '../LevelBuilder';
import type { LevelDefinition } from '../types';

export const MAGNETIC_BASTION_LEVEL: LevelDefinition = {
  id: 'bastion_magnetico',
  name: 'Bastión Magnético',
  description: 'Fortaleza electromagnética donde debes empujar núcleos de ferrita a las bobinas receptoras.',
  difficulty: 'dificil',
  tier: 'maestro',
  uniqueMechanic: 'magnetic_blocks',
  mechanicHint: 'Bloques magnéticos polares: empuja los núcleos con precisión para alimentar la puerta central.',
  parTimeSeconds: 140,
  rewards: { xp: 300, coins: 120 },
  spawn: new THREE.Vector3(0, 0.1, -12),
  objective: { collect: 6, reach: true, physics: { count: 2, targetId: 'coil' } },
  build(ctx) {
    const { builder } = ctx;

    // Suelo metálico oscuro
    builder.box({ x: 0, y: -0.5, z: 0, w: 26, h: 1, d: 28, color: 0x0f172a, metalness: 0.9, roughness: 0.2 });

    // Líneas de neón electromagnéticas
    builder.neonLightStrip({ x: -6, y: 0.05, z: 0, w: 0.4, h: 0.1, d: 24, color: 0xa855f7, emissive: 0x9333ea });
    builder.neonLightStrip({ x: 6, y: 0.05, z: 0, w: 0.4, h: 0.1, d: 24, color: 0xa855f7, emissive: 0x9333ea });

    // Dos núcleos de ferrita dinámicos
    builder.ball({ x: -4, y: 0.8, z: -4, r: 0.45, mass: 2.0, restitution: 0.2, friction: 0.4 });
    builder.ball({ x: 4, y: 0.8, z: -4, r: 0.45, mass: 2.0, restitution: 0.2, friction: 0.4 });

    // Bobinas receptoras (target zone)
    builder.targetZone({ id: 'coil', x: 0, y: 0, z: 4, w: 6, h: 2, d: 4 });

    // Fichas
    builder.collectible({ x: -8, y: 0.9, z: -8 });
    builder.collectible({ x: 8, y: 0.9, z: -8 });
    builder.collectible({ x: -4, y: 0.9, z: 2 });
    builder.collectible({ x: 4, y: 0.9, z: 2 });
    builder.collectible({ x: -7, y: 0.9, z: 8 });
    builder.collectible({ x: 7, y: 0.9, z: 8 });

    // Meta
    builder.goal({ x: 0, y: 0, z: 11, w: 3, h: 3, d: 0.8, label: 'Núcleo Central' });
  }
};
