export type QuestType = 'MainQuest' | 'SideQuest' | 'DailyChallenge' | 'ExplorationQuest';
export type ObjectiveMode = 'sequential' | 'parallel';

export interface QuestObjective {
  id: string;
  description: string;
  completed: boolean;
  type: 'talk' | 'collect' | 'reach' | 'solve' | 'discover';
  referenceId?: string;
  count?: number;
  current?: number;
}

export interface QuestPrerequisite {
  type: 'quest' | 'relationship' | 'level';
  referenceId: string;
  minValue?: number;
}

export interface Quest {
  id: string;
  type: QuestType;
  title: string;
  description: string;
  chainId?: string;
  prerequisites?: QuestPrerequisite[];
  objectives: QuestObjective[];
  objectiveMode: ObjectiveMode;
  rewards: { xp: number; coins: number; itemIds?: string[] };
  expiresAt?: number;
  markerNpcIds?: string[];
}

export interface QuestChain {
  id: string;
  title: string;
  description: string;
  questIds: string[];
}

export const QUEST_CHAINS: Record<string, QuestChain> = {
  certamen: {
    id: 'certamen',
    title: 'El Gran Certamen del IES',
    description: 'La gran aventura escolar a través de las 8 zonas del instituto.',
    questIds: [
      'main_quest_1', 'main_quest_2', 'main_quest_3', 'main_quest_4',
      'main_quest_5', 'main_quest_6', 'main_quest_7', 'main_quest_8',
      'main_quest_9', 'main_quest_10', 'main_quest_11', 'main_quest_12'
    ]
  },
  biblioteca_mystery: {
    id: 'biblioteca_mystery',
    title: 'Misterio en la Biblioteca',
    description: 'Investiga los enigmas ocultos entre las páginas de los libros centenarios.',
    questIds: ['side_biblio_1', 'side_biblio_2', 'side_biblio_3', 'side_biblio_4', 'side_biblio_5']
  },
  reto_deportivo: {
    id: 'reto_deportivo',
    title: 'Reto Deportivo del IES',
    description: 'Supera las pruebas de agilidad, puntería y física en la pista deportiva.',
    questIds: ['side_sport_1', 'side_sport_2', 'side_sport_3', 'side_sport_4', 'side_sport_5']
  }
};

export const QUEST_DEFINITIONS: Record<string, Quest> = {
  // Main Chain: 12 Quests
  main_quest_1: {
    id: 'main_quest_1',
    type: 'MainQuest',
    title: '1. El Despertar del Estudiante',
    description: 'Habla con la Directora y Don Manuel en el Patio Central para registrarte en el Certamen.',
    chainId: 'certamen',
    objectiveMode: 'sequential',
    objectives: [
      { id: 'mq1_obj1', description: 'Habla con Doña Elena en el patio', completed: false, type: 'talk', referenceId: 'directora_elena' },
      { id: 'mq1_obj2', description: 'Consulta a Don Manuel sobre las pruebas', completed: false, type: 'talk', referenceId: 'don_manuel' }
    ],
    rewards: { xp: 100, coins: 50 },
    markerNpcIds: ['directora_elena', 'don_manuel']
  },

  main_quest_2: {
    id: 'main_quest_2',
    type: 'MainQuest',
    title: '2. El Secreto de la Fuente',
    description: 'Recoge las 3 fichas de estudio repartidas por el Patio Central.',
    chainId: 'certamen',
    prerequisites: [{ type: 'quest', referenceId: 'main_quest_1' }],
    objectiveMode: 'parallel',
    objectives: [
      { id: 'mq2_obj1', description: 'Recoge 3 fichas de estudio', completed: false, type: 'collect', count: 3, current: 0 }
    ],
    rewards: { xp: 120, coins: 60 }
  },

  main_quest_3: {
    id: 'main_quest_3',
    type: 'MainQuest',
    title: '3. El Susurro de los Libros',
    description: 'Dirígete a la Biblioteca y habla con Doña Carmen para abrir la sección literaria.',
    chainId: 'certamen',
    prerequisites: [{ type: 'quest', referenceId: 'main_quest_2' }],
    objectiveMode: 'sequential',
    objectives: [
      { id: 'mq3_obj1', description: 'Visita la Biblioteca escolar', completed: false, type: 'reach', referenceId: 'biblioteca' },
      { id: 'mq3_obj2', description: 'Habla con Doña Carmen', completed: false, type: 'talk', referenceId: 'dona_carmen' }
    ],
    rewards: { xp: 150, coins: 75 },
    markerNpcIds: ['dona_carmen']
  },

  main_quest_4: {
    id: 'main_quest_4',
    type: 'MainQuest',
    title: '4. El Códice de Cervantes',
    description: 'Resuelve el criptograma de Miguel de Cervantes en la Biblioteca.',
    chainId: 'certamen',
    prerequisites: [{ type: 'quest', referenceId: 'main_quest_3' }],
    objectiveMode: 'sequential',
    objectives: [
      { id: 'mq4_obj1', description: 'Descifra el Códice Criptográfico', completed: false, type: 'solve', referenceId: 'puzzle_cervantes_cipher' }
    ],
    rewards: { xp: 200, coins: 100 },
    markerNpcIds: ['cervantes']
  },

  main_quest_5: {
    id: 'main_quest_5',
    type: 'MainQuest',
    title: '5. La Chispa del Laboratorio',
    description: 'Accede al Laboratorio de Ciencias y conoce a Santiago Ramón y Cajal.',
    chainId: 'certamen',
    prerequisites: [{ type: 'quest', referenceId: 'main_quest_4' }],
    objectiveMode: 'sequential',
    objectives: [
      { id: 'mq5_obj1', description: 'Entra en el Laboratorio', completed: false, type: 'reach', referenceId: 'laboratorio' },
      { id: 'mq5_obj2', description: 'Habla con Ramón y Cajal', completed: false, type: 'talk', referenceId: 'cajal' }
    ],
    rewards: { xp: 220, coins: 110 },
    markerNpcIds: ['cajal']
  },

  main_quest_6: {
    id: 'main_quest_6',
    type: 'MainQuest',
    title: '6. Sinapsis en Cadena',
    description: 'Completa la prueba de conexión neuronal del doctor Cajal.',
    chainId: 'certamen',
    prerequisites: [{ type: 'quest', referenceId: 'main_quest_5' }],
    objectiveMode: 'sequential',
    objectives: [
      { id: 'mq6_obj1', description: 'Conecta las sinapsis neuronales', completed: false, type: 'solve', referenceId: 'puzzle_cajal_synapse' }
    ],
    rewards: { xp: 250, coins: 125 }
  },

  main_quest_7: {
    id: 'main_quest_7',
    type: 'MainQuest',
    title: '7. Espíritu Deportivo',
    description: 'Ayuda a Marcos en la Pista Deportiva y demuestra tus reflejos físicos.',
    chainId: 'certamen',
    prerequisites: [{ type: 'quest', referenceId: 'main_quest_6' }],
    objectiveMode: 'sequential',
    objectives: [
      { id: 'mq7_obj1', description: 'Habla con Marcos en la pista', completed: false, type: 'talk', referenceId: 'marcos_alumno' },
      { id: 'mq7_obj2', description: 'Marca un gol de futsal', completed: false, type: 'solve', referenceId: 'futsal_goal' }
    ],
    rewards: { xp: 280, coins: 140 },
    markerNpcIds: ['marcos_alumno']
  },

  main_quest_8: {
    id: 'main_quest_8',
    type: 'MainQuest',
    title: '8. El Huerto de la Biodiversidad',
    description: 'Explora el Huerto Escolar y aprende botánica con el Profesor Alberto.',
    chainId: 'certamen',
    prerequisites: [{ type: 'quest', referenceId: 'main_quest_7' }],
    objectiveMode: 'sequential',
    objectives: [
      { id: 'mq8_obj1', description: 'Habla con el Profesor Alberto', completed: false, type: 'talk', referenceId: 'profesor_alberto' },
      { id: 'mq8_obj2', description: 'Inspecciona los bancales de cultivo', completed: false, type: 'discover', referenceId: 'huerto_escolar' }
    ],
    rewards: { xp: 300, coins: 150 },
    markerNpcIds: ['profesor_alberto']
  },

  main_quest_9: {
    id: 'main_quest_9',
    type: 'MainQuest',
    title: '9. El Código Binario',
    description: 'Visita la Sala de Informática y programa tu primer algoritmo con Soraya y Ada Lovelace.',
    chainId: 'certamen',
    prerequisites: [{ type: 'quest', referenceId: 'main_quest_8' }],
    objectiveMode: 'sequential',
    objectives: [
      { id: 'mq9_obj1', description: 'Habla con la Profesora Soraya', completed: false, type: 'talk', referenceId: 'profesora_soraya' },
      { id: 'mq9_obj2', description: 'Consulta el algoritmo con Ada Lovelace', completed: false, type: 'talk', referenceId: 'ada_lovelace' }
    ],
    rewards: { xp: 350, coins: 175 },
    markerNpcIds: ['profesora_soraya', 'ada_lovelace']
  },

  main_quest_10: {
    id: 'main_quest_10',
    type: 'MainQuest',
    title: '10. El Sendero de los Clásicos',
    description: 'Descubre el Pasillo de Historia y equilibra la balanza algebraica de Pitágoras.',
    chainId: 'certamen',
    prerequisites: [{ type: 'quest', referenceId: 'main_quest_9' }],
    objectiveMode: 'sequential',
    objectives: [
      { id: 'mq10_obj1', description: 'Habla con Pitágoras de Samos', completed: false, type: 'talk', referenceId: 'pitagoras' },
      { id: 'mq10_obj2', description: 'Resuelve la Balanza Algebraica', completed: false, type: 'solve', referenceId: 'puzzle_algebra_balance' }
    ],
    rewards: { xp: 400, coins: 200 },
    markerNpcIds: ['pitagoras']
  },

  main_quest_11: {
    id: 'main_quest_11',
    type: 'MainQuest',
    title: '11. Hacia las Alturas',
    description: 'Asciende al Tejado Secreto del IES y debate sobre el futuro con Doña Eva.',
    chainId: 'certamen',
    prerequisites: [{ type: 'quest', referenceId: 'main_quest_10' }],
    objectiveMode: 'sequential',
    objectives: [
      { id: 'mq11_obj1', description: 'Llega al Tejado Secreto', completed: false, type: 'reach', referenceId: 'tejado_secreto' },
      { id: 'mq11_obj2', description: 'Habla con Doña Eva', completed: false, type: 'talk', referenceId: 'eva_filosofa' }
    ],
    rewards: { xp: 450, coins: 225 },
    markerNpcIds: ['eva_filosofa']
  },

  main_quest_12: {
    id: 'main_quest_12',
    type: 'MainQuest',
    title: '12. La Gran Final del Certamen',
    description: 'Supera el desafío final del certamen con la Directora y corona a tu instituto.',
    chainId: 'certamen',
    prerequisites: [{ type: 'quest', referenceId: 'main_quest_11' }],
    objectiveMode: 'sequential',
    objectives: [
      { id: 'mq12_obj1', description: 'Presenta el proyecto final a Doña Elena', completed: false, type: 'talk', referenceId: 'directora_elena' }
    ],
    rewards: { xp: 1000, coins: 500, itemIds: ['backpack_pro', 'gold_crown'] },
    markerNpcIds: ['directora_elena']
  },

  // Secondary Chain A: Biblioteca (5 Quests)
  side_biblio_1: {
    id: 'side_biblio_1',
    type: 'SideQuest',
    title: 'El Tomo Extraviado',
    description: 'Ayuda a Don Pedro a encontrar el diccionario etimológico perdido.',
    chainId: 'biblioteca_mystery',
    objectiveMode: 'sequential',
    objectives: [
      { id: 'sb1_obj1', description: 'Habla con Don Pedro en la biblioteca', completed: false, type: 'talk', referenceId: 'pedro_bibliotecario' },
      { id: 'sb1_obj2', description: 'Encuentra el tomo entre las estanterías', completed: false, type: 'collect', referenceId: 'book_etymology' }
    ],
    rewards: { xp: 150, coins: 60 }
  },

  side_biblio_2: {
    id: 'side_biblio_2',
    type: 'SideQuest',
    title: 'La Tinta Secreta',
    description: 'Prepara una solución de tinta invisible con Doña Carmen.',
    chainId: 'biblioteca_mystery',
    prerequisites: [{ type: 'quest', referenceId: 'side_biblio_1' }],
    objectiveMode: 'sequential',
    objectives: [
      { id: 'sb2_obj1', description: 'Consigue extracto de limón en la cantina', completed: false, type: 'collect', referenceId: 'lemon_extract' },
      { id: 'sb2_obj2', description: 'Entrega la tinta a Doña Carmen', completed: false, type: 'talk', referenceId: 'dona_carmen' }
    ],
    rewards: { xp: 170, coins: 70 }
  },

  side_biblio_3: {
    id: 'side_biblio_3',
    type: 'SideQuest',
    title: 'Catalogación Nocturna',
    description: 'Ordena los manuscritos por orden cronológico en el fichero.',
    chainId: 'biblioteca_mystery',
    prerequisites: [{ type: 'quest', referenceId: 'side_biblio_2' }],
    objectiveMode: 'sequential',
    objectives: [
      { id: 'sb3_obj1', description: 'Ordena 5 tarjetas bibliográficas', completed: false, type: 'solve', count: 5, current: 0 }
    ],
    rewards: { xp: 190, coins: 80 }
  },

  side_biblio_4: {
    id: 'side_biblio_4',
    type: 'SideQuest',
    title: 'El Manuscrito de Don Quijote',
    description: 'Encuentra la primera edición facsímil firmada por Cervantes.',
    chainId: 'biblioteca_mystery',
    prerequisites: [{ type: 'quest', referenceId: 'side_biblio_3' }],
    objectiveMode: 'sequential',
    objectives: [
      { id: 'sb4_obj1', description: 'Descubre el facsímil en el estante de clásicos', completed: false, type: 'discover', referenceId: 'quijote_facsimile' }
    ],
    rewards: { xp: 220, coins: 90 }
  },

  side_biblio_5: {
    id: 'side_biblio_5',
    type: 'SideQuest',
    title: 'El Guardián del Saber',
    description: 'Recibe el título honorífico de Guardián de la Biblioteca.',
    chainId: 'biblioteca_mystery',
    prerequisites: [{ type: 'quest', referenceId: 'side_biblio_4' }],
    objectiveMode: 'sequential',
    objectives: [
      { id: 'sb5_obj1', description: 'Habla con Don Pedro para recibir tu diploma', completed: false, type: 'talk', referenceId: 'pedro_bibliotecario' }
    ],
    rewards: { xp: 300, coins: 150, itemIds: ['biblio_badge'] }
  },

  // Secondary Chain B: Reto Deportivo (5 Quests)
  side_sport_1: {
    id: 'side_sport_1',
    type: 'SideQuest',
    title: 'Calentamiento Matutino',
    description: 'Haz 3 vueltas de calentamiento en la pista con el Profesor Raúl.',
    chainId: 'reto_deportivo',
    objectiveMode: 'sequential',
    objectives: [
      { id: 'ss1_obj1', description: 'Habla con el Profesor Raúl', completed: false, type: 'talk', referenceId: 'raul_atleta' },
      { id: 'ss1_obj2', description: 'Corre 100 metros en la pista', completed: false, type: 'reach', referenceId: 'pista_deportiva' }
    ],
    rewards: { xp: 140, coins: 50 }
  },

  side_sport_2: {
    id: 'side_sport_2',
    type: 'SideQuest',
    title: 'El Balón Perdido de Marcos',
    description: 'Busca el balón reglamentario que voló hacia el tejadillo.',
    chainId: 'reto_deportivo',
    prerequisites: [{ type: 'quest', referenceId: 'side_sport_1' }],
    objectiveMode: 'sequential',
    objectives: [
      { id: 'ss2_obj1', description: 'Localiza el balón en las gradas', completed: false, type: 'collect', referenceId: 'ball_marcos' },
      { id: 'ss2_obj2', description: 'Devuelve el balón a Marcos', completed: false, type: 'talk', referenceId: 'marcos_alumno' }
    ],
    rewards: { xp: 160, coins: 60 }
  },

  side_sport_3: {
    id: 'side_sport_3',
    type: 'SideQuest',
    title: 'Triple Matemático',
    description: 'Acierta 3 canastas de baloncesto respondiendo preguntas numéricas.',
    chainId: 'reto_deportivo',
    prerequisites: [{ type: 'quest', referenceId: 'side_sport_2' }],
    objectiveMode: 'sequential',
    objectives: [
      { id: 'ss3_obj1', description: 'Encesta 3 canastas matemáticas', completed: false, type: 'solve', count: 3, current: 0 }
    ],
    rewards: { xp: 200, coins: 80 }
  },

  side_sport_4: {
    id: 'side_sport_4',
    type: 'SideQuest',
    title: 'Carrera de Obstáculos',
    description: 'Supera el circuito de conos y vallas sin derribar ninguno.',
    chainId: 'reto_deportivo',
    prerequisites: [{ type: 'quest', referenceId: 'side_sport_3' }],
    objectiveMode: 'sequential',
    objectives: [
      { id: 'ss4_obj1', description: 'Completa la carrera de obstáculos', completed: false, type: 'solve', referenceId: 'minigame_obstacle' }
    ],
    rewards: { xp: 240, coins: 100 }
  },

  side_sport_5: {
    id: 'side_sport_5',
    type: 'SideQuest',
    title: 'Campeones del Recreo',
    description: 'Lidera a tu equipo hacia la victoria en el torneo de recreo.',
    chainId: 'reto_deportivo',
    prerequisites: [{ type: 'quest', referenceId: 'side_sport_4' }],
    objectiveMode: 'sequential',
    objectives: [
      { id: 'ss5_obj1', description: 'Gana el partido contra 4º de ESO', completed: false, type: 'talk', referenceId: 'raul_atleta' }
    ],
    rewards: { xp: 350, coins: 160, itemIds: ['sports_trophy'] }
  }
};
