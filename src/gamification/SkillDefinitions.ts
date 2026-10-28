export type SkillBranch = 'explorador' | 'academico' | 'artesano';

export interface SkillEffect {
  type:
    | 'sprintSpeedMult'
    | 'jumpHeightMult'
    | 'xpPerfectMult'
    | 'revealAnswerCharge'
    | 'collectibleRadiusMult'
    | 'relicDetect'
    | 'coinPickupMult'
    | 'doubleJump'
    | 'dashAbility'
    | 'stealthRadius'
    | 'quizTimerBonus'
    | 'xpStreakBonus'
    | 'extraHint'
    | 'perfectQuizCoins'
    | 'craftAbility'
    | 'shopDiscountMult'
    | 'goldMedalBoost'
    | string;
  value: number;
}

export interface Skill {
  id: string;
  branch: SkillBranch;
  depth: number; // 1, 2, 3
  displayName: string;
  description: string;
  effect: SkillEffect;
  prerequisiteIds: string[];
  cost: number; // always 1
}

export const SKILL_DEFINITIONS: Skill[] = [
  // --- Rama 1: EXPLORADOR (Movilidad y Aventura) ---
  // Profundidad 1
  {
    id: 'sprint_1',
    branch: 'explorador',
    depth: 1,
    displayName: 'Zapatillas Aladas',
    description: 'Incrementa la velocidad de sprint en un 15%.',
    effect: { type: 'sprintSpeedMult', value: 1.15 },
    prerequisiteIds: [],
    cost: 1
  },
  {
    id: 'jump_1',
    branch: 'explorador',
    depth: 1,
    displayName: 'Salto Atlético',
    description: 'Aumenta la altura de salto en un 20%.',
    effect: { type: 'jumpHeightMult', value: 1.20 },
    prerequisiteIds: [],
    cost: 1
  },
  // Profundidad 2
  {
    id: 'sprint_2',
    branch: 'explorador',
    depth: 2,
    displayName: 'Velocista Escolar',
    description: 'Aumenta un 10% adicional la velocidad punta en carrera.',
    effect: { type: 'sprintSpeedMult', value: 1.25 },
    prerequisiteIds: ['sprint_1', 'jump_1'],
    cost: 1
  },
  {
    id: 'jump_2',
    branch: 'explorador',
    depth: 2,
    displayName: 'Doble Salto',
    description: 'Permite ejecutar un segundo impulso acrobático en el aire.',
    effect: { type: 'doubleJump', value: 1 },
    prerequisiteIds: ['sprint_1', 'jump_1'],
    cost: 1
  },
  // Profundidad 3
  {
    id: 'dash_1',
    branch: 'explorador',
    depth: 3,
    displayName: 'Impulso Dash',
    description: 'Habilita una aceleración instantánea evasiva pulsando Shift.',
    effect: { type: 'dashAbility', value: 1 },
    prerequisiteIds: ['sprint_2', 'jump_2'],
    cost: 1
  },
  {
    id: 'stealth_1',
    branch: 'explorador',
    depth: 3,
    displayName: 'Paso Silencioso',
    description: 'Reduce el rango de alerta y detección de los profesores en el patio.',
    effect: { type: 'stealthRadius', value: 0.7 },
    prerequisiteIds: ['sprint_2', 'jump_2'],
    cost: 1
  },

  // --- Rama 2: ACADÉMICO (Retos y Enigmas) ---
  // Profundidad 1
  {
    id: 'xp_perfect_1',
    branch: 'academico',
    depth: 1,
    displayName: 'Estudioso Perfecto',
    description: 'Duplica (2×) los puntos de experiencia en completaciones perfectas de Puzzles.',
    effect: { type: 'xpPerfectMult', value: 2.0 },
    prerequisiteIds: [],
    cost: 1
  },
  {
    id: 'reveal_1',
    branch: 'academico',
    depth: 1,
    displayName: 'Apuntes del Empollón',
    description: 'Revela la respuesta correcta una vez por sesión de Puzzle.',
    effect: { type: 'revealAnswerCharge', value: 1 },
    prerequisiteIds: [],
    cost: 1
  },
  // Profundidad 2
  {
    id: 'timer_1',
    branch: 'academico',
    depth: 2,
    displayName: 'Gestión del Tiempo',
    description: 'Concede +10 segundos adicionales en los temporizadores de quiz.',
    effect: { type: 'quizTimerBonus', value: 10 },
    prerequisiteIds: ['xp_perfect_1', 'reveal_1'],
    cost: 1
  },
  {
    id: 'xp_streak_1',
    branch: 'academico',
    depth: 2,
    displayName: 'Racha de Aciertos',
    description: 'Multiplica por 1.25 los puntos al encadenar respuestas correctas consecutivas.',
    effect: { type: 'xpStreakBonus', value: 1.25 },
    prerequisiteIds: ['xp_perfect_1', 'reveal_1'],
    cost: 1
  },
  // Profundidad 3
  {
    id: 'hint_1',
    branch: 'academico',
    depth: 3,
    displayName: 'Mente Prodigiosa',
    description: 'Proporciona una pista detallada automática en preguntas de máxima dificultad.',
    effect: { type: 'extraHint', value: 1 },
    prerequisiteIds: ['timer_1', 'xp_streak_1'],
    cost: 1
  },
  {
    id: 'curriculum_1',
    branch: 'academico',
    depth: 3,
    displayName: 'Beca de Excelencia',
    description: 'Otorga 10 monedas extra por cada respuesta correcta sin fallo en el quiz.',
    effect: { type: 'perfectQuizCoins', value: 10 },
    prerequisiteIds: ['timer_1', 'xp_streak_1'],
    cost: 1
  },

  // --- Rama 3: ARTESANO (Recolección y Economía) ---
  // Profundidad 1
  {
    id: 'collectible_radius_1',
    branch: 'artesano',
    depth: 1,
    displayName: 'Imán de Monedas',
    description: 'Aumenta el radio de recogida de coleccionables en un 30%.',
    effect: { type: 'collectibleRadiusMult', value: 1.30 },
    prerequisiteIds: [],
    cost: 1
  },
  {
    id: 'relic_detect_1',
    branch: 'artesano',
    depth: 1,
    displayName: 'Sensor Arqueológico',
    description: 'Emite un destello dorado visual en pantalla al aproximarse a una reliquia oculta.',
    effect: { type: 'relicDetect', value: 1 },
    prerequisiteIds: [],
    cost: 1
  },
  // Profundidad 2
  {
    id: 'coin_pickup_1',
    branch: 'artesano',
    depth: 2,
    displayName: 'Bolsillo Ahorrador',
    description: 'Incrementa en un 20% el valor de las monedas recogidas en el mapa.',
    effect: { type: 'coinPickupMult', value: 1.20 },
    prerequisiteIds: ['collectible_radius_1', 'relic_detect_1'],
    cost: 1
  },
  {
    id: 'craft_1',
    branch: 'artesano',
    depth: 2,
    displayName: 'Manitas del Taller',
    description: 'Habilita la síntesis de consumibles y potenciadores temporales en la tienda.',
    effect: { type: 'craftAbility', value: 1 },
    prerequisiteIds: ['collectible_radius_1', 'relic_detect_1'],
    cost: 1
  },
  // Profundidad 3
  {
    id: 'shop_discount_1',
    branch: 'artesano',
    depth: 3,
    displayName: 'Descuento de la Cooperativa',
    description: 'Aplica un 10% de rebaja en todos los artículos de la tienda escolar.',
    effect: { type: 'shopDiscountMult', value: 0.90 },
    prerequisiteIds: ['coin_pickup_1', 'craft_1'],
    cost: 1
  },
  {
    id: 'medal_1',
    branch: 'artesano',
    depth: 3,
    displayName: 'Forjador de Oro',
    description: 'Las medallas de plata en Puzzles se consideran de oro para desbloqueos.',
    effect: { type: 'goldMedalBoost', value: 1 },
    prerequisiteIds: ['coin_pickup_1', 'craft_1'],
    cost: 1
  }
];
