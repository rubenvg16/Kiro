/**
 * Conjunto de colisionadores del Patio del IES.
 *
 * Este módulo es la ÚNICA fuente de verdad sobre "qué bloquea al alumno".
 * Es PURO DATOS: no importa THREE, no ejecuta lógica y no depende de nada,
 * para que cualquier capa (física, IA, depuración) pueda consumirlo.
 *
 * Todos los valores están derivados de la geometría REAL construida en
 * `WorldEnvironment.ts` (posiciones y tamaños exactos de cada malla).
 */

// --- Interfaces públicas -------------------------------------------------

/** Colisionador de caja alineado con los ejes del mundo. */
export interface SchoolBoxCollider {
  id: string;
  /** Posición del centro de la caja en coordenadas de mundo. */
  center: [number, number, number];
  /** Semi-tampos de la caja (tamaño completo / 2). */
  half: [number, number, number];
  friction?: number;
  restitution?: number;
}

/** Colisionador esférico. */
export interface SchoolSphereCollider {
  id: string;
  center: [number, number, number];
  radius: number;
  friction?: number;
  restitution?: number;
}

// --- Constantes de material (fricción/restitución por defecto) ------------

/** Fricción de superficies naturales (cemento, tierra, grava). */
const NATURAL_FRICTION = 0.7;

/** Fricción de superficies construidas (ladrillo, metal, madera). */
const BUILT_FRICTION = 0.6;

/** Ninguna geometría estática rebota (ni el suelo ni los edificios). */
const STATIC_RESTITUTION = 0.05;

// --- Límites del patio --------------------------------------------------

/** Límite jugable del recreo: el alumno nunca puede salir de aquí. */
export const SCHOOL_BOUNDS = {
  minX: -37,
  maxX: 37,
  minZ: -37,
  maxZ: 37
} as const;

// --- Transformaciones de los props nuevos (fuente única de verdad) -------
// `WorldEnvironment.ts` importa estas constantes para construir las mallas,
// de modo que malla y colisionador nunca pueden separarse.

/** Lado de las cajas de madera (metros). */
export const CRATE_SIZE = 0.9;

/** Centros de las cajas apiladas junto al porche del IES. */
export const CRATE_STACK_POSITIONS: ReadonlyArray<readonly [number, number, number]> = [
  [2.8, 0.45, -10.0],
  [2.8, 1.35, -10.0]
];

/** Centro del podio dorado junto a la portería de fútbol sala. */
export const GOLD_PODIUM_POSITION: readonly [number, number, number] = [-3.0, 0.6, -2.5];

/** Lado del podio dorado (metros). */
export const GOLD_PODIUM_SIZE = 1.2;

// --- Colisionadores ------------------------------------------------------

/**
 * Cajas estáticas del patio.
 * Origen de coordenadas: centro de la caja en coordenadas de mundo.
 */
export const SCHOOL_BOX_COLLIDERS: SchoolBoxCollider[] = [
  // --- Suelo general (80 x 80 m, cara superior exactamente en y = 0) ---
  {
    id: 'ground',
    center: [0, -0.5, 0],
    half: [40, 0.5, 40],
    friction: NATURAL_FRICTION,
    restitution: STATIC_RESTITUTION
  },

  // --- Edificio Central del IES (grupo en 0, 0, -18) ---
  {
    id: 'ies_body',
    center: [0, 4.5, -18],
    half: [14, 4.5, 6],
    friction: BUILT_FRICTION,
    restitution: STATIC_RESTITUTION
  },
  {
    id: 'ies_zocalo',
    center: [0, 0.4, -18],
    half: [14.2, 0.4, 6.2],
    friction: BUILT_FRICTION,
    restitution: STATIC_RESTITUTION
  },
  {
    id: 'ies_roof_trim',
    center: [0, 9.35, -18],
    half: [14.3, 0.35, 6.3],
    friction: BUILT_FRICTION,
    restitution: STATIC_RESTITUTION
  },

  // --- Porche del IES (techo y pilares) ---
  {
    id: 'porch_canopy',
    center: [0, 4.4, -10.2],
    half: [3.5, 0.2, 2],
    friction: BUILT_FRICTION,
    restitution: STATIC_RESTITUTION
  },
  {
    id: 'porch_pillar_w',
    center: [-3.2, 2.2, -8.5],
    half: [0.2, 2.2, 0.2],
    friction: BUILT_FRICTION,
    restitution: STATIC_RESTITUTION
  },
  {
    id: 'porch_pillar_e',
    center: [3.2, 2.2, -8.5],
    half: [0.2, 2.2, 0.2],
    friction: BUILT_FRICTION,
    restitution: STATIC_RESTITUTION
  },

  // --- Porterías de fútbol sala (pista en -6, 0.01, 10) ---
  // Postes macizos; travesaño por encima de la cabeza del alumno.
  {
    id: 'court_goal_n_post_w',
    center: [-7.8, 1.01, -2.5],
    half: [0.08, 1, 0.08],
    friction: BUILT_FRICTION,
    restitution: STATIC_RESTITUTION
  },
  {
    id: 'court_goal_n_post_e',
    center: [-4.2, 1.01, -2.5],
    half: [0.08, 1, 0.08],
    friction: BUILT_FRICTION,
    restitution: STATIC_RESTITUTION
  },
  {
    id: 'court_goal_n_bar',
    center: [-6, 2.01, -2.5],
    half: [1.8, 0.08, 0.08],
    friction: BUILT_FRICTION,
    restitution: STATIC_RESTITUTION
  },
  {
    id: 'court_goal_s_post_w',
    center: [-7.8, 1.01, 22.5],
    half: [0.08, 1, 0.08],
    friction: BUILT_FRICTION,
    restitution: STATIC_RESTITUTION
  },
  {
    id: 'court_goal_s_post_e',
    center: [-4.2, 1.01, 22.5],
    half: [0.08, 1, 0.08],
    friction: BUILT_FRICTION,
    restitution: STATIC_RESTITUTION
  },
  {
    id: 'court_goal_s_bar',
    center: [-6, 2.01, 22.5],
    half: [1.8, 0.08, 0.08],
    friction: BUILT_FRICTION,
    restitution: STATIC_RESTITUTION
  },

  // --- Gimnasio escolar (grupo en 20, 0, 8) ---
  {
    id: 'gym_body',
    center: [20, 3.5, 8],
    half: [7, 3.5, 11],
    friction: BUILT_FRICTION,
    restitution: STATIC_RESTITUTION
  },
  {
    id: 'gym_roof_trim',
    center: [20, 7.6, 8],
    half: [7.5, 0.6, 11.5],
    friction: BUILT_FRICTION,
    restitution: STATIC_RESTITUTION
  },

  // --- Cantina escolar (grupo en -20, 0, -16) ---
  {
    id: 'canteen_body',
    center: [-20, 2.25, -16],
    half: [4, 2.25, 3.5],
    friction: BUILT_FRICTION,
    restitution: STATIC_RESTITUTION
  },
  {
    id: 'canteen_awning',
    center: [-20, 3.2, -11.8],
    half: [3.5, 0.3, 1],
    friction: BUILT_FRICTION,
    restitution: STATIC_RESTITUTION
  },

  // --- Huerto escolar (grupo en -26, 0, 6): bancales de madera ---
  {
    id: 'garden_bed_0',
    center: [-26, 0.1, 2],
    half: [3, 0.1, 0.6],
    friction: NATURAL_FRICTION,
    restitution: STATIC_RESTITUTION
  },
  {
    id: 'garden_bed_1',
    center: [-26, 0.1, 4],
    half: [3, 0.1, 0.6],
    friction: NATURAL_FRICTION,
    restitution: STATIC_RESTITUTION
  },
  {
    id: 'garden_bed_2',
    center: [-26, 0.1, 6],
    half: [3, 0.1, 0.6],
    friction: NATURAL_FRICTION,
    restitution: STATIC_RESTITUTION
  },
  {
    id: 'garden_bed_3',
    center: [-26, 0.1, 8],
    half: [3, 0.1, 0.6],
    friction: NATURAL_FRICTION,
    restitution: STATIC_RESTITUTION
  },
  {
    id: 'garden_bed_4',
    center: [-26, 0.1, 10],
    half: [3, 0.1, 0.6],
    friction: NATURAL_FRICTION,
    restitution: STATIC_RESTITUTION
  },

  // --- Bancos de madera ---
  {
    id: 'bench_0',
    center: [7, 0.22, -1],
    half: [1.1, 0.225, 0.275],
    friction: BUILT_FRICTION,
    restitution: STATIC_RESTITUTION
  },
  {
    id: 'bench_1',
    center: [7, 0.22, 3],
    half: [1.1, 0.225, 0.275],
    friction: BUILT_FRICTION,
    restitution: STATIC_RESTITUTION
  },
  {
    id: 'bench_2',
    center: [-17, 0.22, -1],
    half: [0.275, 0.225, 1.1],
    friction: BUILT_FRICTION,
    restitution: STATIC_RESTITUTION
  },
  {
    id: 'bench_3',
    center: [-17, 0.22, 4],
    half: [0.275, 0.225, 1.1],
    friction: BUILT_FRICTION,
    restitution: STATIC_RESTITUTION
  },
  {
    id: 'bench_4',
    center: [-14, 0.22, -14],
    half: [1.1, 0.225, 0.275],
    friction: BUILT_FRICTION,
    restitution: STATIC_RESTITUTION
  },

  // --- Aparcabicicletas ---
  {
    id: 'bike_rack_0',
    center: [6.5, 0.22, -10],
    half: [0.44, 0.22, 0.08],
    friction: BUILT_FRICTION,
    restitution: STATIC_RESTITUTION
  },
  {
    id: 'bike_rack_1',
    center: [7.4, 0.22, -10],
    half: [0.44, 0.22, 0.08],
    friction: BUILT_FRICTION,
    restitution: STATIC_RESTITUTION
  },
  {
    id: 'bike_rack_2',
    center: [8.3, 0.22, -10],
    half: [0.44, 0.22, 0.08],
    friction: BUILT_FRICTION,
    restitution: STATIC_RESTITUTION
  },
  {
    id: 'bike_rack_3',
    center: [9.2, 0.22, -10],
    half: [0.44, 0.22, 0.08],
    friction: BUILT_FRICTION,
    restitution: STATIC_RESTITUTION
  },

  // --- Árboles (troncos macizos) ---
  {
    id: 'tree_0',
    center: [-26, 1.2, -10],
    half: [0.4, 1.2, 0.4],
    friction: BUILT_FRICTION,
    restitution: STATIC_RESTITUTION
  },
  {
    id: 'tree_1',
    center: [-26, 1.2, 0],
    half: [0.4, 1.2, 0.4],
    friction: BUILT_FRICTION,
    restitution: STATIC_RESTITUTION
  },
  {
    id: 'tree_2',
    center: [-26, 1.2, 12],
    half: [0.4, 1.2, 0.4],
    friction: BUILT_FRICTION,
    restitution: STATIC_RESTITUTION
  },
  {
    id: 'tree_3',
    center: [-32, 1.2, -6],
    half: [0.4, 1.2, 0.4],
    friction: BUILT_FRICTION,
    restitution: STATIC_RESTITUTION
  },
  {
    id: 'tree_4',
    center: [-32, 1.2, 6],
    half: [0.4, 1.2, 0.4],
    friction: BUILT_FRICTION,
    restitution: STATIC_RESTITUTION
  },
  {
    id: 'tree_5',
    center: [32, 1.2, -8],
    half: [0.4, 1.2, 0.4],
    friction: BUILT_FRICTION,
    restitution: STATIC_RESTITUTION
  },
  {
    id: 'tree_6',
    center: [32, 1.2, 2],
    half: [0.4, 1.2, 0.4],
    friction: BUILT_FRICTION,
    restitution: STATIC_RESTITUTION
  },
  {
    id: 'tree_7',
    center: [32, 1.2, 14],
    half: [0.4, 1.2, 0.4],
    friction: BUILT_FRICTION,
    restitution: STATIC_RESTITUTION
  },
  {
    id: 'tree_8',
    center: [-14, 1.2, 20],
    half: [0.4, 1.2, 0.4],
    friction: BUILT_FRICTION,
    restitution: STATIC_RESTITUTION
  },
  {
    id: 'tree_9',
    center: [14, 1.2, 20],
    half: [0.4, 1.2, 0.4],
    friction: BUILT_FRICTION,
    restitution: STATIC_RESTITUTION
  },

  // --- Cajas de madera apiladas junto al porche ---
  {
    id: 'crate_0',
    center: [2.8, 0.45, -10],
    half: [0.45, 0.45, 0.45],
    friction: BUILT_FRICTION,
    restitution: STATIC_RESTITUTION
  },
  {
    id: 'crate_1',
    center: [2.8, 1.35, -10],
    half: [0.45, 0.45, 0.45],
    friction: BUILT_FRICTION,
    restitution: STATIC_RESTITUTION
  },

  // --- Podio dorado junto a la portería ---
  {
    id: 'gold_podium',
    center: [-3, 0.6, -2.5],
    half: [0.6, 0.6, 0.6],
    friction: BUILT_FRICTION,
    restitution: STATIC_RESTITUTION
  },

  // --- Muros invisibles del perímetro del recreo ---
  {
    id: 'boundary_north',
    center: [0, 3, -37],
    half: [37.5, 3, 0.5],
    friction: BUILT_FRICTION,
    restitution: STATIC_RESTITUTION
  },
  {
    id: 'boundary_south',
    center: [0, 3, 37],
    half: [37.5, 3, 0.5],
    friction: BUILT_FRICTION,
    restitution: STATIC_RESTITUTION
  },
  {
    id: 'boundary_east',
    center: [37, 3, 0],
    half: [0.5, 3, 37.5],
    friction: BUILT_FRICTION,
    restitution: STATIC_RESTITUTION
  },
  {
    id: 'boundary_west',
    center: [-37, 3, 0],
    half: [0.5, 3, 37.5],
    friction: BUILT_FRICTION,
    restitution: STATIC_RESTITUTION
  }
];

/**
 * Esferas estáticas del patio (plantas del huerto, fuente y papeleras).
 */
export const SCHOOL_SPHERE_COLLIDERS: SchoolSphereCollider[] = [
  // --- Plantas del huerto (25 conos, 5 filas x 5 columnas) ---
  // Fila 0 (z = 2)
  { id: 'garden_plant_r0_c0', center: [-28.4, 0.35, 2], radius: 0.2, friction: NATURAL_FRICTION, restitution: STATIC_RESTITUTION },
  { id: 'garden_plant_r0_c1', center: [-27.2, 0.35, 2], radius: 0.2, friction: NATURAL_FRICTION, restitution: STATIC_RESTITUTION },
  { id: 'garden_plant_r0_c2', center: [-26, 0.35, 2], radius: 0.2, friction: NATURAL_FRICTION, restitution: STATIC_RESTITUTION },
  { id: 'garden_plant_r0_c3', center: [-24.8, 0.35, 2], radius: 0.2, friction: NATURAL_FRICTION, restitution: STATIC_RESTITUTION },
  { id: 'garden_plant_r0_c4', center: [-23.6, 0.35, 2], radius: 0.2, friction: NATURAL_FRICTION, restitution: STATIC_RESTITUTION },
  // Fila 1 (z = 4)
  { id: 'garden_plant_r1_c0', center: [-28.4, 0.35, 4], radius: 0.2, friction: NATURAL_FRICTION, restitution: STATIC_RESTITUTION },
  { id: 'garden_plant_r1_c1', center: [-27.2, 0.35, 4], radius: 0.2, friction: NATURAL_FRICTION, restitution: STATIC_RESTITUTION },
  { id: 'garden_plant_r1_c2', center: [-26, 0.35, 4], radius: 0.2, friction: NATURAL_FRICTION, restitution: STATIC_RESTITUTION },
  { id: 'garden_plant_r1_c3', center: [-24.8, 0.35, 4], radius: 0.2, friction: NATURAL_FRICTION, restitution: STATIC_RESTITUTION },
  { id: 'garden_plant_r1_c4', center: [-23.6, 0.35, 4], radius: 0.2, friction: NATURAL_FRICTION, restitution: STATIC_RESTITUTION },
  // Fila 2 (z = 6)
  { id: 'garden_plant_r2_c0', center: [-28.4, 0.35, 6], radius: 0.2, friction: NATURAL_FRICTION, restitution: STATIC_RESTITUTION },
  { id: 'garden_plant_r2_c1', center: [-27.2, 0.35, 6], radius: 0.2, friction: NATURAL_FRICTION, restitution: STATIC_RESTITUTION },
  { id: 'garden_plant_r2_c2', center: [-26, 0.35, 6], radius: 0.2, friction: NATURAL_FRICTION, restitution: STATIC_RESTITUTION },
  { id: 'garden_plant_r2_c3', center: [-24.8, 0.35, 6], radius: 0.2, friction: NATURAL_FRICTION, restitution: STATIC_RESTITUTION },
  { id: 'garden_plant_r2_c4', center: [-23.6, 0.35, 6], radius: 0.2, friction: NATURAL_FRICTION, restitution: STATIC_RESTITUTION },
  // Fila 3 (z = 8)
  { id: 'garden_plant_r3_c0', center: [-28.4, 0.35, 8], radius: 0.2, friction: NATURAL_FRICTION, restitution: STATIC_RESTITUTION },
  { id: 'garden_plant_r3_c1', center: [-27.2, 0.35, 8], radius: 0.2, friction: NATURAL_FRICTION, restitution: STATIC_RESTITUTION },
  { id: 'garden_plant_r3_c2', center: [-26, 0.35, 8], radius: 0.2, friction: NATURAL_FRICTION, restitution: STATIC_RESTITUTION },
  { id: 'garden_plant_r3_c3', center: [-24.8, 0.35, 8], radius: 0.2, friction: NATURAL_FRICTION, restitution: STATIC_RESTITUTION },
  { id: 'garden_plant_r3_c4', center: [-23.6, 0.35, 8], radius: 0.2, friction: NATURAL_FRICTION, restitution: STATIC_RESTITUTION },
  // Fila 4 (z = 10)
  { id: 'garden_plant_r4_c0', center: [-28.4, 0.35, 10], radius: 0.2, friction: NATURAL_FRICTION, restitution: STATIC_RESTITUTION },
  { id: 'garden_plant_r4_c1', center: [-27.2, 0.35, 10], radius: 0.2, friction: NATURAL_FRICTION, restitution: STATIC_RESTITUTION },
  { id: 'garden_plant_r4_c2', center: [-26, 0.35, 10], radius: 0.2, friction: NATURAL_FRICTION, restitution: STATIC_RESTITUTION },
  { id: 'garden_plant_r4_c3', center: [-24.8, 0.35, 10], radius: 0.2, friction: NATURAL_FRICTION, restitution: STATIC_RESTITUTION },
  { id: 'garden_plant_r4_c4', center: [-23.6, 0.35, 10], radius: 0.2, friction: NATURAL_FRICTION, restitution: STATIC_RESTITUTION },

  // --- Fuente del patio ---
  { id: 'fountain_base', center: [6, 0.5, -2], radius: 0.35, friction: BUILT_FRICTION, restitution: STATIC_RESTITUTION },
  { id: 'fountain_basin', center: [6, 1, -2], radius: 0.5, friction: BUILT_FRICTION, restitution: STATIC_RESTITUTION },

  // --- Papeleras de reciclaje ---
  { id: 'waste_bin_yellow', center: [8.5, 0.4, -2], radius: 0.25, friction: BUILT_FRICTION, restitution: STATIC_RESTITUTION },
  { id: 'waste_bin_blue', center: [9.2, 0.4, -2], radius: 0.25, friction: BUILT_FRICTION, restitution: STATIC_RESTITUTION }
];
