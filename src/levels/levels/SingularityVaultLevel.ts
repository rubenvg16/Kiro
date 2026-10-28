import * as THREE from 'three';
import type { LevelDefinition } from '../types';

export const SINGULARITY_VAULT_LEVEL: LevelDefinition = {
  id: 'boveda_singularidad',
  name: 'Bóveda de la Singularidad',
  description: 'El desafío definitivo del Instituto: manipula bloques magnéticos pesados bajo gravedad reducida y resuelve la puerta híbrida antes del colapso.',
  difficulty: 'dificil',
  tier: 'maestro',
  uniqueMechanic: 'gravity_inversion',
  mechanicHint: 'Combina saltos de baja gravedad con el empuje de cubos cuánticos hacia los pedestales.',
  parTimeSeconds: 160,
  rewards: { xp: 500, coins: 250 },
  spawn: new THREE.Vector3(0, 0.1, -14),
  objective: {
    collect: 6,
    reach: true,
    physics: { count: 2, targetId: 'pedestal_singular' }
  },
  hasHybridGate: true,
  build(ctx) {
    const { builder } = ctx;

    // Plataforma central flotante de la bóveda
    builder.box({ x: 0, y: -0.5, z: 0, w: 28, h: 1, d: 32, color: 0x0f172a });

    // Columnas de contención cuántica
    builder.cylinder({ x: -10, y: 4, z: -10, r: 1, h: 8, color: 0x7c3aed });
    builder.cylinder({ x: 10, y: 4, z: -10, r: 1, h: 8, color: 0x7c3aed });
    builder.cylinder({ x: -10, y: 4, z: 10, r: 1, h: 8, color: 0x7c3aed });
    builder.cylinder({ x: 10, y: 4, z: 10, r: 1, h: 8, color: 0x7c3aed });

    // Plataformas elevadas
    builder.emissivePlatform({ x: -6, y: 3.5, z: -4, w: 3, h: 0.4, d: 3, color: 0xa855f7, emissive: 0x9333ea });
    builder.emissivePlatform({ x: 6, y: 3.5, z: 4, w: 3, h: 0.4, d: 3, color: 0xa855f7, emissive: 0x9333ea });

    // 2 Cubos dinámicos cuánticos a colocar en la zona objetivo
    builder.crate({ x: -4, y: 0.6, z: -6, size: 1.1, mass: 2.5 });
    builder.crate({ x: 4, y: 0.6, z: -6, size: 1.1, mass: 2.5 });

    // Zona receptora de física (pedestales)
    builder.targetZone({
      id: 'pedestal_singular',
      x: 0,
      y: 0,
      z: 6,
      w: 6,
      h: 1,
      d: 4
    });

    // Fichas coleccionables
    builder.collectible({ x: -6, y: 4.2, z: -4 });
    builder.collectible({ x: 6, y: 4.2, z: 4 });
    builder.collectible({ x: -8, y: 0.9, z: 0 });
    builder.collectible({ x: 8, y: 0.9, z: 0 });
    builder.collectible({ x: 0, y: 0.9, z: -10 });
    builder.collectible({ x: 0, y: 0.9, z: 10 });

    // Barrera de energía / puerta híbrida
    builder.buildHybridGate({
      x: 0,
      y: 0,
      z: 11,
      w: 4,
      h: 3.5,
      question: '¿Qué principio físico describe la curvatura del espacio-tiempo por la masa?',
      answer: 'Relatividad General'
    });

    // Meta final
    builder.goal({ x: 0, y: 0, z: 14, w: 3, h: 3, d: 0.8, label: 'Portal Singular' });
  }
};
