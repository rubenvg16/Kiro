import * as THREE from 'three';
import type { LevelDefinition } from '../types';

/**
 * Nivel 4 - "Parkour del porche".
 *
 * Cadena de 9 plataformas que sube hacia el cielo. No hay suelo: si el jugador
 * cae por debajo de y = -3 reaparece en el último checkpoint.
 *
 * Aritmética del salto (constantes reales del motor: salto 6.4 m/s, gravedad
 * 9.81 m/s², carrera 6.2 m/s, ápice 6.4²/(2·9.81) = 2.09 m):
 *  - Los peldaños de 0.4 m se suben andando (altura de escalón del motor 0.45 m).
 *  - Los saltos reales tienen un desnivel de 0.8 m (< 70% del ápice = 1.46 m) y
 *    un hueco de 2.8 m (< 45% de la distancia de sprint con salto = 3.64 m).
 *    Con el hueco de 2.8 m el jugador alcanza la altura de 0.8 m antes de
 *    tocar el lateral de la plataforma (t = (2.8 - 0.35)/3.4 = 0.72 s, altura
 *    2.06 m), así que salta andando o corriendo.
 */
export const PARKOUR_LEVEL: LevelDefinition = {
  id: 'parkour_porche',
  name: 'Parkour del porche',
  description:
    'Salta de plataforma en plataforma por el porche. Si caes, el último checkpoint te salva: no te rindas.',
  difficulty: 'dificil',
  tier: 'explorador',
  uniqueMechanic: 'timed_platforming',
  mechanicHint: 'Plataformas suspendidas en altura: sincroniza el sprint y el impulso de salto.',
  parTimeSeconds: 120,
  rewards: { xp: 200, coins: 80 },
  spawn: new THREE.Vector3(0, 0.9, 0),
  objective: { collect: 8, reach: true, physics: null },
  build(ctx) {
    const { builder } = ctx;

    // Suelo indicativo del vacío (solo decorativo, no colisiona).
    builder.visualBox({ x: 0, y: -3.6, z: -22, w: 40, h: 0.4, d: 60, color: 0x3a2020 });

    // Plataforma inicial (top 0.8 m).

    // Peldaños de 0.4 m (se suben andando).

    // Primer salto: hueco de 2.8 m y desnivel de 0.8 m hacia la plataforma 4.

    // Quinto peldaño (top 2.8 m).

    // Segundo salto hacia la plataforma 6 (top 3.6 m).

    // Séptimo peldaño (top 4.0 m).

    // Tercer salto hacia la plataforma 8 (top 4.8 m).

    // Cuarto salto hacia la plataforma final (top 5.2 m).

    // Checkpoints en las plataformas 3, 6 y 9.
    builder.checkpoint({ x: 0, y: 1.6, z: -7 });
    builder.checkpoint({ x: 0, y: 3.6, z: -24.6 });
    builder.checkpoint({ x: 0, y: 5.2, z: -43.2 });

    // Ocho fichas: cinco en suelo (se cogen andando) y tres en el borde de las
    // plataformas, a 1.8 m de altura (exigen un salto preciso).
    builder.collectible({ x: 0, y: 1.7, z: 0 });
    builder.collectible({ x: 0, y: 3.4, z: -8 });
    builder.collectible({ x: 1, y: 3.3, z: -13.8 });
    builder.collectible({ x: 0, y: 4.6, z: -19 });
    builder.collectible({ x: 0, y: 4.5, z: -24.6 });
    builder.collectible({ x: -1, y: 4.9, z: -28.6 });
    builder.collectible({ x: -1, y: 5.8, z: -29.8 });
    builder.collectible({ x: 0, y: 6.1, z: -43.2 });

    // Meta sobre la última plataforma.
    builder.goal({ x: 0, y: 5.2, z: -43.2, w: 3, h: 2.8, d: 0.8, label: 'Meta' });
  },
};
