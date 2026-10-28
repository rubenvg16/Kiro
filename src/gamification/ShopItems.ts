export type ShopCategory =
  | 'avatar_accessories'
  | 'backpack_upgrades'
  | 'zone_decorations'
  | 'puzzle_consumables';

export interface ExtendedShopItem {
  id: string;
  name: string;
  icon: string;
  category: ShopCategory;
  price: number;
  description: string;
  isLimitedTime?: boolean;
  availableFrom?: string; // ISO date 'YYYY-MM-DD'
  availableTo?: string;   // ISO date 'YYYY-MM-DD'
  isSeasonalCollectible?: boolean;
}

export const EXTENDED_SHOP_ITEMS: ExtendedShopItem[] = [
  // --- Categoría 1: Accesorios de Avatar (5 items) ---
  {
    id: 'glasses',
    name: 'Gafas de Pasta Clásicas',
    icon: '👓',
    category: 'avatar_accessories',
    price: 50,
    description: 'Montura elegante que aporta estilo intelectual a tu personaje.'
  },
  {
    id: 'cap',
    name: 'Gorra Deportiva Escolar',
    icon: '🧢',
    category: 'avatar_accessories',
    price: 75,
    description: 'Gorra con visera ideal para protegerse del sol durante el recreo.'
  },
  {
    id: 'scarf_winter',
    name: 'Bufanda del Instituto',
    icon: '🧣',
    category: 'avatar_accessories',
    price: 60,
    description: 'Bufanda cálida tejida con los colores representativos del IES.'
  },
  {
    id: 'crown_scholar',
    name: 'Corona de Laurel Académica',
    icon: '👑',
    category: 'avatar_accessories',
    price: 250,
    description: 'Corona dorada reservada para las mentes más brillantes del centro.'
  },
  {
    id: 'headphones_dj',
    name: 'Auriculares Inalámbricos',
    icon: '🎧',
    category: 'avatar_accessories',
    price: 120,
    description: 'Auriculares de diadema con cancelación activa de ruido ambiental.'
  },

  // --- Categoría 2: Mejoras de Mochila (5 items) ---
  {
    id: 'backpack',
    name: 'Mochila Escolar Básica',
    icon: '🎒',
    category: 'backpack_upgrades',
    price: 100,
    description: 'Mochila estándar ergonómica para guardar libros y materiales.'
  },
  {
    id: 'backpack_reinforced',
    name: 'Mochila Reforzada Multibolsillos',
    icon: '🧳',
    category: 'backpack_upgrades',
    price: 150,
    description: 'Mayor capacidad de carga y resistencia contra el desgaste.'
  },
  {
    id: 'backpack_solar',
    name: 'Mochila con Panel Solar',
    icon: '🔋',
    category: 'backpack_upgrades',
    price: 200,
    description: 'Recarga dispositivos tecnológicos aprovechando la luz diurna.'
  },
  {
    id: 'keychain_mascot',
    name: 'Llavero de la Mascota',
    icon: '🗝️',
    category: 'backpack_upgrades',
    price: 40,
    description: 'Colgante de la lechuza sabionda que da buena suerte en los exámenes.'
  },
  {
    id: 'thermos_bottle',
    name: 'Cantimplora Térmica',
    icon: '🍶',
    category: 'backpack_upgrades',
    price: 60,
    description: 'Mantiene las bebidas frescas durante las jornadas en la pista deportiva.'
  },

  // --- Categoría 3: Decoraciones de Zona (5 items) ---
  {
    id: 'bench_cushion',
    name: 'Cojín de Lectura para la Biblioteca',
    icon: '🛋️',
    category: 'zone_decorations',
    price: 80,
    description: 'Acondiciona los bancos de madera para hacer la lectura más placentera.'
  },
  {
    id: 'plant_pot_garden',
    name: 'Jardinera de Aromáticas para el Huerto',
    icon: '🪴',
    category: 'zone_decorations',
    price: 90,
    description: 'Maceta con romero y lavanda para embellecer el huerto escolar.'
  },
  {
    id: 'banner_ies',
    name: 'Estandarte Conmemorativo del IES',
    icon: '🚩',
    category: 'zone_decorations',
    price: 140,
    description: 'Estandarte de tela bordado para colgar en el patio central.'
  },
  {
    id: 'science_poster',
    name: 'Lámina Científica del Laboratorio',
    icon: '🖼️',
    category: 'zone_decorations',
    price: 110,
    description: 'Ilustración anatómica y botánica enmarcada para las paredes.'
  },
  {
    id: 'trophy_cup',
    name: 'Trofeo Deportivo Brillante',
    icon: '🏆',
    category: 'zone_decorations',
    price: 300,
    description: 'Copa dorada para colocar en la vitrina de la pista polideportiva.'
  },

  // --- Categoría 4: Consumibles de Puzzle (5 items) ---
  {
    id: 'time_freeze_potion',
    name: 'Reloj de Arena Congelador',
    icon: '⏳',
    category: 'puzzle_consumables',
    price: 45,
    description: 'Pausa el temporizador durante 15 segundos en cualquier reto académico.'
  },
  {
    id: 'hint_scroll',
    name: 'Pergamino de Revelación',
    icon: '📜',
    category: 'puzzle_consumables',
    price: 55,
    description: 'Descarta dos respuestas erróneas en preguntas de opción múltiple.'
  },
  {
    id: 'formula_sheet',
    name: 'Chuleta de Fórmulas Autorizada',
    icon: '📝',
    category: 'puzzle_consumables',
    price: 35,
    description: 'Muestra las relaciones matemáticas clave para resolver ecuaciones.'
  },
  {
    id: 'magnifying_glass',
    name: 'Lupa de Alta Precisión',
    icon: '🔍',
    category: 'puzzle_consumables',
    price: 65,
    description: 'Destaca pistas visuales sutiles en los retos de observación del entorno.'
  },
  {
    id: 'curie_prism',
    name: 'Prisma Óptico de Newton',
    icon: '💎',
    category: 'puzzle_consumables',
    price: 85,
    description: 'Descompone el haz de luz y duplica las monedas al superar el puzzle.'
  },

  // --- Coleccionables Estacionales (3 items) ---
  {
    id: 'seasonal_halloween_pumpkin',
    name: 'Calabaza Iluminada de Halloween',
    icon: '🎃',
    category: 'zone_decorations',
    price: 99,
    description: 'Decoración festiva con vela parpadeante para la víspera de Todos los Santos.',
    isLimitedTime: true,
    isSeasonalCollectible: true,
    availableFrom: '2026-10-15',
    availableTo: '2026-11-05'
  },
  {
    id: 'seasonal_navidad_hat',
    name: 'Gorro Navideño Acolchado',
    icon: '🎅',
    category: 'avatar_accessories',
    price: 99,
    description: 'Gorro rojo con borla blanca para celebrar las fiestas de invierno.',
    isLimitedTime: true,
    isSeasonalCollectible: true,
    availableFrom: '2026-12-01',
    availableTo: '2027-01-10'
  },
  {
    id: 'seasonal_primavera_flower',
    name: 'Corona Floral de Primavera',
    icon: '🌸',
    category: 'avatar_accessories',
    price: 99,
    description: 'Diadema con flores silvestres para dar la bienvenida al buen tiempo.',
    isLimitedTime: true,
    isSeasonalCollectible: true,
    availableFrom: '2026-03-20',
    availableTo: '2026-05-15'
  }
];
