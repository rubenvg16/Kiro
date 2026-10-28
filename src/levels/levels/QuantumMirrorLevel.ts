import * as THREE from 'three';
import type { LevelDefinition } from '../types';

export const QUANTUM_MIRROR_LEVEL: LevelDefinition = {
  id: 'laberinto_cuantico',
  name: 'Laberinto de Espejos Cuánticos',
  description: 'Un laberinto de paneles reflectantes superpuestos con plataformas que cambian de fase lumínica.',
  difficulty: 'dificil',
  tier: 'maestro',
  uniqueMechanic: 'mirror_rooms',
  mechanicHint: 'Espejos cuánticos: observa las sombras y los reflejos para encontrar los paneles transitables.',
  parTimeSeconds: 145,
  rewards: { xp: 320, coins: 130 },
  spawn: new THREE.Vector3(0, 0.1, -12),
  objective: { collect: 7, reach: true, physics: null },
  build(ctx) {
    const { builder } = ctx;

    builder.box({ x: 0, y: -0.5, z: 0, w: 26, h: 1, d: 28, color: 0x18181b, metalness: 0.9, roughness: 0.1 });

    // Paneles de cristal con alta reflectancia
    builder.box({ x: -5, y: 1.5, z: -5, w: 0.3, h: 3, d: 8, color: 0x67e8f9, metalness: 0.95, roughness: 0.05 });
    builder.box({ x: 5, y: 1.5, z: -2, w: 0.3, h: 3, d: 10, color: 0x67e8f9, metalness: 0.95, roughness: 0.05 });
    builder.box({ x: -3, y: 1.5, z: 5, w: 10, h: 3, d: 0.3, color: 0x67e8f9, metalness: 0.95, roughness: 0.05 });

    // Fichas
    builder.collectible({ x: -8, y: 0.9, z: -8 });
    builder.collectible({ x: 8, y: 0.9, z: -8 });
    builder.collectible({ x: 0, y: 0.9, z: -3 });
    builder.collectible({ x: -6, y: 0.9, z: 2 });
    builder.collectible({ x: 4, y: 0.9, z: 4 });
    builder.collectible({ x: -8, y: 0.9, z: 8 });
    builder.collectible({ x: 8, y: 0.9, z: 8 });

    builder.checkpoint({ x: 0, y: 0.1, z: 1 });
    builder.goal({ x: 0, y: 0, z: 12, w: 3, h: 3, d: 0.8, label: 'Portal Cuántico' });
  }
};
