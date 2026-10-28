import * as THREE from 'three';
import type { LevelDefinition } from '../types';

export const CRYO_LAB_LEVEL: LevelDefinition = {
  id: 'laboratorio_criogenico',
  name: 'Laboratorio Criogénico',
  description: 'Deslízate por plataformas gélidas y transporta las muestras de nitrógeno hasta la zona de almacenamiento.',
  difficulty: 'media',
  tier: 'investigador',
  uniqueMechanic: 'ice_surfaces',
  mechanicHint: 'Superficie de hielo resbaladiza: deslízate aprovechando la inercia sin perder el control.',
  parTimeSeconds: 100,
  rewards: { xp: 180, coins: 70 },
  spawn: new THREE.Vector3(0, 0.1, -12),
  objective: { collect: 5, reach: true, physics: { count: 1, targetId: 'freezer' } },
  build(ctx) {
    const { builder } = ctx;

    // Suelo helado con baja fricción
    builder.box({ x: 0, y: -0.5, z: 0, w: 26, h: 1, d: 28, color: 0xa5f3fc, roughness: 0.1, friction: 0.1 });

    // Muros perimetrales del laboratorio
    builder.box({ x: -13.2, y: 1.5, z: 0, w: 0.4, h: 3, d: 28.8, color: 0x0284c7 });
    builder.box({ x: 13.2, y: 1.5, z: 0, w: 0.4, h: 3, d: 28.8, color: 0x0284c7 });
    builder.box({ x: 0, y: 1.5, z: -14.2, w: 26.8, h: 3, d: 0.4, color: 0x0284c7 });
    builder.box({ x: 0, y: 1.5, z: 14.2, w: 26.8, h: 3, d: 0.4, color: 0x0284c7 });

    // Plataformas flotantes emisivas
    builder.emissivePlatform({ x: -5, y: 0.8, z: -3, w: 4, h: 1.6, d: 4, color: 0x38bdf8, emissive: 0x0ea5e9 });
    builder.emissivePlatform({ x: 5, y: 1.4, z: 3, w: 4, h: 2.8, d: 4, color: 0x38bdf8, emissive: 0x0ea5e9 });

    // Cilindro criogénico empujable
    builder.ball({ x: 0, y: 0.8, z: -4, r: 0.4, mass: 1.0, restitution: 0.7, friction: 0.1 });

    // Coleccionables
    builder.collectible({ x: -5, y: 2.2, z: -3 });
    builder.collectible({ x: 5, y: 3.4, z: 3 });
    builder.collectible({ x: -8, y: 0.9, z: 6 });
    builder.collectible({ x: 8, y: 0.9, z: -6 });
    builder.collectible({ x: 0, y: 0.9, z: 8 });

    // Zona congelador donde empujar la muestra criogénica
    builder.targetZone({ id: 'freezer', x: 0, y: 0, z: 2, w: 3, h: 2, d: 3 });

    // Meta
    builder.goal({ x: 0, y: 0, z: 11, w: 3, h: 3, d: 0.8, label: 'Cámara Térmica' });
  }
};
