import * as THREE from 'three';
import type { LevelDefinition } from '../types';

export const WIND_TUNNEL_LEVEL: LevelDefinition = {
  id: 'tunel_viento',
  name: 'Túnel de Viento Aerodinámico',
  description: 'Las turbinas del túnel generan intensas corrientes de aire que impulsan y desvían los saltos.',
  difficulty: 'dificil',
  tier: 'investigador',
  uniqueMechanic: 'wind_gusts',
  mechanicHint: 'Túnel de viento: las corrientes aéreas laterales desplazan tu salto; calcula la deriva.',
  parTimeSeconds: 130,
  rewards: { xp: 260, coins: 95 },
  spawn: new THREE.Vector3(0, 0.1, -12),
  objective: { collect: 6, reach: true, physics: null },
  build(ctx) {
    const { builder } = ctx;

    // Pasarela principal estrecha suspendida
    builder.box({ x: 0, y: -0.5, z: 0, w: 6, h: 1, d: 28, color: 0x64748b });

    // Islas laterales accesibles solo dejándose llevar por las corrientes de viento
    builder.emissivePlatform({ x: -7, y: 0.6, z: -5, w: 4, h: 1.2, d: 4, color: 0x38bdf8 });
    builder.emissivePlatform({ x: 7, y: 0.8, z: 2, w: 4, h: 1.6, d: 4, color: 0x38bdf8 });
    builder.emissivePlatform({ x: -6, y: 1.0, z: 8, w: 4, h: 2.0, d: 4, color: 0x38bdf8 });

    // Turbinas visuales en los laterales
    builder.cylinder({ x: -10, y: 2, z: 0, r: 1.5, h: 0.8, color: 0x94a3b8 });
    builder.cylinder({ x: 10, y: 2, z: 0, r: 1.5, h: 0.8, color: 0x94a3b8 });

    // Fichas
    builder.collectible({ x: 0, y: 0.9, z: -8 });
    builder.collectible({ x: -7, y: 1.8, z: -5 });
    builder.collectible({ x: 0, y: 0.9, z: 0 });
    builder.collectible({ x: 7, y: 2.2, z: 2 });
    builder.collectible({ x: -6, y: 2.6, z: 8 });
    builder.collectible({ x: 0, y: 0.9, z: 7 });

    // Checkpoint
    builder.checkpoint({ x: 0, y: 0.1, z: 0 });

    // Meta
    builder.goal({ x: 0, y: 0, z: 12, w: 3, h: 3, d: 0.8, label: 'Cámara Silenciosa' });
  }
};
