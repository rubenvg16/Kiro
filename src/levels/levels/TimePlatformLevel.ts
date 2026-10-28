import * as THREE from 'three';
import { LEVEL_COLORS } from '../LevelBuilder';
import type { LevelDefinition } from '../types';

export const TIME_PLATFORM_LEVEL: LevelDefinition = {
  id: 'salto_temporal',
  name: 'Salto Temporal de Precisión',
  description: 'Circuito de plataformas flotantes cronometradas suspendidas sobre el abismo del patio.',
  difficulty: 'dificil',
  tier: 'maestro',
  uniqueMechanic: 'timed_platforming',
  mechanicHint: 'Plataformas de tiempo estricto: encadena saltos sin titubear para mantener la inercia.',
  parTimeSeconds: 150,
  rewards: { xp: 340, coins: 140 },
  spawn: new THREE.Vector3(0, 0.1, -13),
  objective: { collect: 8, reach: true, physics: null },
  build(ctx) {
    const { builder } = ctx;

    // Plataforma de salida
    builder.box({ x: 0, y: -0.5, z: -13, w: 8, h: 1, d: 6, color: 0x334155 });

    // Serie de plataformas escalonadas sobre el vacío
    builder.emissivePlatform({ x: -4, y: 0.6, z: -8, w: 3.5, h: 1.2, d: 3.5, color: 0xef4444, emissive: 0xb91c1c });
    builder.emissivePlatform({ x: 0, y: 1.2, z: -4, w: 3.5, h: 1.2, d: 3.5, color: 0xf59e0b, emissive: 0xb45309 });
    builder.emissivePlatform({ x: 4, y: 1.8, z: 0, w: 3.5, h: 1.2, d: 3.5, color: 0x10b981, emissive: 0x047857 });
    builder.emissivePlatform({ x: 0, y: 2.4, z: 4, w: 3.5, h: 1.2, d: 3.5, color: 0x3b82f6, emissive: 0x1d4ed8 });
    builder.emissivePlatform({ x: -4, y: 3.0, z: 8, w: 3.5, h: 1.2, d: 3.5, color: 0x8b5cf6, emissive: 0x6d28d9 });

    // Plataforma de llegada
    builder.box({ x: 0, y: 2.6, z: 13, w: 8, h: 1, d: 6, color: 0x334155 });

    // Fichas
    builder.collectible({ x: 0, y: 0.9, z: -13 });
    builder.collectible({ x: -4, y: 1.8, z: -8 });
    builder.collectible({ x: 0, y: 2.4, z: -4 });
    builder.collectible({ x: 4, y: 3.0, z: 0 });
    builder.collectible({ x: 0, y: 3.6, z: 4 });
    builder.collectible({ x: -4, y: 4.2, z: 8 });
    builder.collectible({ x: -2, y: 4.0, z: 11 });
    builder.collectible({ x: 2, y: 4.0, z: 11 });

    builder.checkpoint({ x: 0, y: 2.0, z: 0 });
    builder.goal({ x: 0, y: 3.1, z: 14, w: 3, h: 3, d: 0.8, label: 'Llegada Crono' });
  }
};
