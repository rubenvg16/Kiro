import * as THREE from 'three';
import { LEVEL_COLORS } from '../LevelBuilder';
import type { LevelDefinition } from '../types';

export const GRAVITY_CHAMBER_LEVEL: LevelDefinition = {
  id: 'camara_oscilacion',
  name: 'Cámara de Oscilación Gravitatoria',
  description: 'Un reactor de pulsos gravitatorios periódicos donde el salto alcanza alturas sobrehumanas.',
  difficulty: 'dificil',
  tier: 'maestro',
  uniqueMechanic: 'gravity_inversion',
  mechanicHint: 'Oscilación de gravedad: aprovecha el pulso ascendente para salvar distancias extremas.',
  parTimeSeconds: 155,
  rewards: { xp: 360, coins: 150 },
  spawn: new THREE.Vector3(0, 0.1, -12),
  objective: { collect: 8, reach: true, physics: null },
  build(ctx) {
    const { builder } = ctx;

    // Suelo con campos de energía
    builder.box({ x: 0, y: -0.5, z: 0, w: 26, h: 1, d: 28, color: 0x1e1b4b });

    // Pilares colosales
    builder.cylinder({ x: -6, y: 3, z: -4, r: 1.2, h: 6, color: 0x312e81 });
    builder.cylinder({ x: 6, y: 3, z: 0, r: 1.2, h: 6, color: 0x312e81 });
    builder.cylinder({ x: -4, y: 3, z: 5, r: 1.2, h: 6, color: 0x312e81 });

    // Plataformas elevadas en la cúspide de los pilares
    builder.emissivePlatform({ x: -6, y: 6.2, z: -4, w: 3.5, h: 0.4, d: 3.5, color: 0x6366f1, emissive: 0x4f46e5 });
    builder.emissivePlatform({ x: 6, y: 6.2, z: 0, w: 3.5, h: 0.4, d: 3.5, color: 0x6366f1, emissive: 0x4f46e5 });
    builder.emissivePlatform({ x: -4, y: 6.2, z: 5, w: 3.5, h: 0.4, d: 3.5, color: 0x6366f1, emissive: 0x4f46e5 });

    // Fichas
    builder.collectible({ x: 0, y: 0.9, z: -8 });
    builder.collectible({ x: -6, y: 7.0, z: -4 });
    builder.collectible({ x: 0, y: 0.9, z: -2 });
    builder.collectible({ x: 6, y: 7.0, z: 0 });
    builder.collectible({ x: 0, y: 0.9, z: 3 });
    builder.collectible({ x: -4, y: 7.0, z: 5 });
    builder.collectible({ x: 4, y: 0.9, z: 8 });
    builder.collectible({ x: -2, y: 0.9, z: 9 });

    builder.checkpoint({ x: 6, y: 6.5, z: 0 });
    builder.goal({ x: 0, y: 0, z: 12, w: 3, h: 3, d: 0.8, label: 'Escape Gravitatorio' });
  }
};
