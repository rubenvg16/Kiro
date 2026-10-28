export type AchievementCategory =
  | 'exploration'
  | 'academic'
  | 'quest'
  | 'puzzle'
  | 'social'
  | 'hidden';

export interface AchievementCondition {
  type: 'count' | 'reach' | 'complete' | 'discover' | 'score';
  referenceId?: string;
  threshold: number;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: AchievementCategory;
  condition: AchievementCondition;
  coinReward: number; // 20 - 200
  isHidden?: boolean;
}

export const ACHIEVEMENT_DEFINITIONS: Achievement[] = [
  // --- Categoría 1: Exploration (6 logros) ---
  {
    id: 'ach_first_steps',
    title: 'Primeros Pasos en el IES',
    description: 'Explora tu primera zona del recinto escolar.',
    icon: '👟',
    category: 'exploration',
    condition: { type: 'count', referenceId: 'zone', threshold: 1 },
    coinReward: 25
  },
  {
    id: 'ach_school_cartographer',
    title: 'Cartógrafo Escolar',
    description: 'Descubre y visita 4 zonas del mapa.',
    icon: '🗺️',
    category: 'exploration',
    condition: { type: 'count', referenceId: 'zone', threshold: 4 },
    coinReward: 60
  },
  {
    id: 'ach_master_explorer',
    title: 'Gran Explorador del Centro',
    description: 'Visita las 8 zonas completas del instituto.',
    icon: '🧭',
    category: 'exploration',
    condition: { type: 'count', referenceId: 'zone', threshold: 8 },
    coinReward: 150
  },
  {
    id: 'ach_rooftop_climber',
    title: 'Vértigo Superado',
    description: 'Accede al Tejado Secreto del IES.',
    icon: '🧗',
    category: 'exploration',
    condition: { type: 'discover', referenceId: 'tejado_secreto', threshold: 1 },
    coinReward: 100
  },
  {
    id: 'ach_coin_collector_10',
    title: 'Monedero Lleno',
    description: 'Recoge 10 monedas o coleccionables repartidos por el patio.',
    icon: '🪙',
    category: 'exploration',
    condition: { type: 'count', referenceId: 'collectible', threshold: 10 },
    coinReward: 40
  },
  {
    id: 'ach_relic_hunter',
    title: 'Buscador de Reliquias',
    description: 'Encuentra tu primera reliquia legendaria oculta.',
    icon: '🏺',
    category: 'exploration',
    condition: { type: 'count', referenceId: 'relic', threshold: 1 },
    coinReward: 75
  },

  // --- Categoría 2: Academic (5 logros) ---
  {
    id: 'ach_first_quiz_correct',
    title: 'Mente Despierta',
    description: 'Responde correctamente a tu primera pregunta curricular.',
    icon: '💡',
    category: 'academic',
    condition: { type: 'count', referenceId: 'quiz_correct', threshold: 1 },
    coinReward: 30
  },
  {
    id: 'ach_quiz_scholar_10',
    title: 'Erudito de Clase',
    description: 'Acumula 10 respuestas correctas en retos académicos.',
    icon: '📖',
    category: 'academic',
    condition: { type: 'count', referenceId: 'quiz_correct', threshold: 10 },
    coinReward: 80
  },
  {
    id: 'ach_perfect_balance',
    title: 'Ecuación Impecable',
    description: 'Resuelve la balanza algebraica sin cometer ningún fallo.',
    icon: '⚖️',
    category: 'academic',
    condition: { type: 'complete', referenceId: 'puzzle_algebra_balance', threshold: 1 },
    coinReward: 70
  },
  {
    id: 'ach_scientific_method',
    title: 'Método Científico',
    description: 'Supera con éxito un reto de Ciencias y Laboratorio.',
    icon: '🔬',
    category: 'academic',
    condition: { type: 'complete', referenceId: 'science_challenge', threshold: 1 },
    coinReward: 50
  },
  {
    id: 'ach_curriculum_master',
    title: 'Matrícula de Honor',
    description: 'Alcanza el nivel 5 de estudiante.',
    icon: '🎓',
    category: 'academic',
    condition: { type: 'reach', referenceId: 'player_level', threshold: 5 },
    coinReward: 120
  },

  // --- Categoría 3: Quest (5 logros) ---
  {
    id: 'ach_first_quest',
    title: 'Primer Encargo',
    description: 'Completa tu primera misión en el instituto.',
    icon: '📜',
    category: 'quest',
    condition: { type: 'count', referenceId: 'quest', threshold: 1 },
    coinReward: 35
  },
  {
    id: 'ach_five_quests',
    title: 'Ayudante Voluntario',
    description: 'Completa 5 misiones del certamen o secundarias.',
    icon: '📋',
    category: 'quest',
    condition: { type: 'count', referenceId: 'quest', threshold: 5 },
    coinReward: 90
  },
  {
    id: 'ach_ten_quests',
    title: 'Pilar de la Comunidad',
    description: 'Completa 10 misiones para los miembros del centro.',
    icon: '🎖️',
    category: 'quest',
    condition: { type: 'count', referenceId: 'quest', threshold: 10 },
    coinReward: 140
  },
  {
    id: 'ach_daily_challenge',
    title: 'Constancia Diaria',
    description: 'Completa un Desafío Diario antes de medianoche.',
    icon: '📅',
    category: 'quest',
    condition: { type: 'complete', referenceId: 'daily_challenge', threshold: 1 },
    coinReward: 60
  },
  {
    id: 'ach_library_mystery',
    title: 'El Secreto de los Libros',
    description: 'Completa la cadena de misiones "Misterio en la Biblioteca".',
    icon: '📚',
    category: 'quest',
    condition: { type: 'complete', referenceId: 'chain_biblioteca', threshold: 1 },
    coinReward: 160
  },

  // --- Categoría 4: Puzzle (5 logros) ---
  {
    id: 'ach_first_puzzle',
    title: 'Rompecabezas Iniciado',
    description: 'Resuelve tu primer enigma o puzzle.',
    icon: '🧩',
    category: 'puzzle',
    condition: { type: 'count', referenceId: 'puzzle', threshold: 1 },
    coinReward: 30
  },
  {
    id: 'ach_gold_medal_first',
    title: 'Puntuación Perfecta',
    description: 'Consigue tu primera Medalla de Oro en un Desafío Híbrido.',
    icon: '🥇',
    category: 'puzzle',
    condition: { type: 'count', referenceId: 'gold_medal', threshold: 1 },
    coinReward: 100
  },
  {
    id: 'ach_gold_medals_three',
    title: 'Trío Dorado',
    description: 'Consigue 3 Medallas de Oro en Puzzles diferentes.',
    icon: '⭐',
    category: 'puzzle',
    condition: { type: 'count', referenceId: 'gold_medal', threshold: 3 },
    coinReward: 180
  },
  {
    id: 'ach_cipher_cracker',
    title: 'Criptoanalista',
    description: 'Descifra el manuscrito en el Cifrado César de Cervantes.',
    icon: '🔐',
    category: 'puzzle',
    condition: { type: 'complete', referenceId: 'puzzle_cervantes_cipher', threshold: 1 },
    coinReward: 70
  },
  {
    id: 'ach_neuron_builder',
    title: 'Arquitecto de la Sinapsis',
    description: 'Supera el reto de la red neuronal de Santiago Ramón y Cajal.',
    icon: '⚡',
    category: 'puzzle',
    condition: { type: 'complete', referenceId: 'puzzle_cajal_synapse', threshold: 1 },
    coinReward: 70
  },

  // --- Categoría 5: Social (4 logros) ---
  {
    id: 'ach_chatty_student',
    title: 'Alumno Comunicativo',
    description: 'Habla con al menos 3 profesores o conserjes del IES.',
    icon: '🗣️',
    category: 'social',
    condition: { type: 'count', referenceId: 'talk_npc', threshold: 3 },
    coinReward: 25
  },
  {
    id: 'ach_best_friends',
    title: 'Amigo de Confianza',
    description: 'Alcanza una puntuación de afinidad de +50 con algún personaje.',
    icon: '🤝',
    category: 'social',
    condition: { type: 'reach', referenceId: 'relationship', threshold: 50 },
    coinReward: 80
  },
  {
    id: 'ach_shop_patron',
    title: 'Cliente Frecuente',
    description: 'Adquiere tu primer accesorio en la tienda del instituto.',
    icon: '🛍️',
    category: 'social',
    condition: { type: 'count', referenceId: 'shop_purchase', threshold: 1 },
    coinReward: 40
  },
  {
    id: 'ach_minigame_record',
    title: 'Campeón del Patio',
    description: 'Establece un nuevo récord personal en cualquier minijuego.',
    icon: '🏅',
    category: 'social',
    condition: { type: 'count', referenceId: 'minigame_record', threshold: 1 },
    coinReward: 50
  },

  // --- Categoría 6: Hidden (6 figuras históricas - Req 14.8) ---
  {
    id: 'ach_figure_cajal',
    title: 'Discípulo de Cajal',
    description: 'Has conversado y superado el enigma con Santiago Ramón y Cajal.',
    icon: '🔬',
    category: 'hidden',
    condition: { type: 'complete', referenceId: 'figure_cajal', threshold: 1 },
    coinReward: 200,
    isHidden: true
  },
  {
    id: 'ach_figure_cervantes',
    title: 'Hidalgo de las Letras',
    description: 'Has conversado y superado el enigma con Miguel de Cervantes.',
    icon: '📜',
    category: 'hidden',
    condition: { type: 'complete', referenceId: 'figure_cervantes', threshold: 1 },
    coinReward: 200,
    isHidden: true
  },
  {
    id: 'ach_figure_pitagoras',
    title: 'Iniciado de Samos',
    description: 'Has conversado y resuelto el misterio con Pitágoras.',
    icon: '📐',
    category: 'hidden',
    condition: { type: 'complete', referenceId: 'figure_pitagoras', threshold: 1 },
    coinReward: 200,
    isHidden: true
  },
  {
    id: 'ach_figure_lovelace',
    title: 'Pionero del Algoritmo',
    description: 'Has conversado y programado con Ada Lovelace.',
    icon: '💻',
    category: 'hidden',
    condition: { type: 'complete', referenceId: 'figure_ada_lovelace', threshold: 1 },
    coinReward: 200,
    isHidden: true
  },
  {
    id: 'ach_figure_hypatia',
    title: 'Guardián de Alejandría',
    description: 'Has conversado y observado las estrellas con Hipatia.',
    icon: '🌌',
    category: 'hidden',
    condition: { type: 'complete', referenceId: 'figure_hipatia', threshold: 1 },
    coinReward: 200,
    isHidden: true
  },
  {
    id: 'ach_figure_curie',
    title: 'Brillo Radiactivo',
    description: 'Has conversado y aislado elementos con Marie Curie.',
    icon: '⚗️',
    category: 'hidden',
    condition: { type: 'complete', referenceId: 'figure_marie_curie', threshold: 1 },
    coinReward: 200,
    isHidden: true
  }
];
