import { EventBus } from '../core/EventBus';

export interface StudentProgress {
  level: number;
  xp: number;
  xpToNextLevel: number;
  coins: number;
  rankTitle: string;
  unlockedItems: string[];
  unlockedRelics: string[];
  completedQuests: string[];
  skillPoints?: number;
}

export interface RelicMeta {
  id: string;
  name: string;
  icon: string;
  locationHint: string;
  rewardDescription: string;
}

/** Accesorio comprable con monedas del juego. */
export interface ShopItem {
  id: string;
  name: string;
  icon: string;
  price: number;
}

export const SHOP_ITEMS: ShopItem[] = [
  { id: 'glasses', name: 'Gafas', icon: '👓', price: 50 },
  { id: 'cap', name: 'Gorra', icon: '🧢', price: 75 },
  { id: 'backpack', name: 'Mochila escolar', icon: '🎒', price: 100 }
];

export const SECRET_RELICS: RelicMeta[] = [
  {
    id: 'relic_porch_key',
    name: 'Llave Maestra de Conserjería',
    icon: '🗝️',
    locationHint: 'Escondida en el tejadillo del porche del IES (¡salta desde los pilares!)',
    rewardDescription: 'Otorga acceso de explorador y +150 Puntos de Estudio.'
  },
  {
    id: 'relic_cervantes_scroll',
    name: 'Pergamino Dorado de Cervantes',
    icon: '📜',
    locationHint: 'Resuelve el Cifrado César o búscalo tras los árboles de la biblioteca.',
    rewardDescription: 'Desbloquea el título de Príncipe de las Letras.'
  },
  {
    id: 'relic_cajal_microscope',
    name: 'Microscopio de Oro de Ramón y Cajal',
    icon: '🔬',
    locationHint: 'Supera el enigma de sinapsis de Cajal o búscalo en el huerto escolar.',
    rewardDescription: 'Premio Nobel Escolar y bata científica.'
  },
  {
    id: 'relic_golden_ball',
    name: 'Balón de Oro del Recreo',
    icon: '🏆',
    locationHint: 'Suspendido en lo alto del larguero de la portería de futbito.',
    rewardDescription: 'Campeón de la Pista Polideportiva.'
  },
  {
    id: 'relic_balance_master',
    name: 'Balanza Perfecta de Pitágoras',
    icon: '⚖️',
    locationHint: 'Equilibra la balanza algebraica en el reto de Pitágoras.',
    rewardDescription: 'Maestro del Álgebra escolar.'
  }
];

const PROGRESS_STORAGE_KEY = 'edu_student_progress_v2';

/** Puntos necesarios para ascender del rango indicado al siguiente. */
function xpToNextLevelFor(level: number): number {
  return 80 + level * 40;
}

const RANKS = [
  { level: 1, title: 'Novato del Recreo' },
  { level: 2, title: 'Alumno Curioso' },
  { level: 3, title: 'Explorador del Aula' },
  { level: 4, title: 'Investigador Escolar' },
  { level: 5, title: 'Erudito del Instituto' },
  { level: 6, title: 'Maestro de la ESO' },
  { level: 7, title: 'Sabio de Bachillerato' },
  { level: 8, title: 'Graduado con Matrícula de Honor' }
];

/** Convierte un valor desconocido en un entero dentro de un rango. */
function clampInt(value: unknown, min: number, max: number, fallback: number): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) return fallback;
  return Math.max(min, Math.min(max, Math.round(value)));
}

/** Normaliza una lista de identificadores guardada en el almacenamiento. */
function sanitizeIdList(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  const ids: string[] = [];
  for (const entry of value) {
    if (typeof entry === 'string' && entry.length > 0 && !ids.includes(entry)) {
      ids.push(entry);
    }
  }
  return ids;
}

export class ProgressionManager {
  private static instance: ProgressionManager;
  public progress: StudentProgress;
  private listeners: Array<(progress: StudentProgress) => void> = [];

  private constructor() {
    this.progress = this.loadProgress();
  }

  public static getInstance(): ProgressionManager {
    if (!ProgressionManager.instance) {
      ProgressionManager.instance = new ProgressionManager();
    }
    return ProgressionManager.instance;
  }

  public static resetInstance(): void {
    ProgressionManager.instance = null as any;
  }

  private getRankForLevel(level: number): string {
    const match = [...RANKS].reverse().find(r => level >= r.level);
    return match ? match.title : 'Novato del Recreo';
  }

  /** Progreso inicial de un alumno nuevo: sólo lleva el accesorio "ninguno". */
  private createDefaultProgress(): StudentProgress {
    return {
      level: 1,
      xp: 0,
      xpToNextLevel: xpToNextLevelFor(1),
      coins: 50,
      rankTitle: 'Novato del Recreo',
      unlockedItems: ['none'],
      unlockedRelics: [],
      completedQuests: [],
      skillPoints: 0
    };
  }

  /**
   * Carga el progreso guardado hydratando TODOS los campos: una partida
   * guardada por una versión anterior (o corrupta) nunca debe dejar campos
   * sin definir, porque el HUD y el puente de retos los leen sin comprobar.
   */
  private loadProgress(): StudentProgress {
    const fallback = this.createDefaultProgress();

    try {
      const saved = localStorage.getItem(PROGRESS_STORAGE_KEY);
      if (!saved) return fallback;

      const parsed: unknown = JSON.parse(saved);
      if (!parsed || typeof parsed !== 'object') return fallback;
      const source = parsed as Partial<StudentProgress>;

      const level = clampInt(source.level, 1, RANKS.length, fallback.level);
      const unlockedItems = sanitizeIdList(source.unlockedItems);
      // El avatar sin accesorios siempre está disponible
      if (!unlockedItems.includes('none')) unlockedItems.unshift('none');

      return {
        level,
        xp: clampInt(source.xp, 0, 1_000_000, fallback.xp),
        xpToNextLevel: xpToNextLevelFor(level),
        coins: clampInt(source.coins, 0, 1_000_000, fallback.coins),
        rankTitle: this.getRankForLevel(level),
        unlockedItems,
        unlockedRelics: sanitizeIdList(source.unlockedRelics),
        completedQuests: sanitizeIdList(source.completedQuests),
        skillPoints: clampInt(source.skillPoints, 0, 1000, fallback.skillPoints || 0)
      };
    } catch (e) {
      console.warn('Error al cargar progreso:', e);
      return fallback;
    }
  }

  public saveProgress(): void {
    try {
      this.progress.rankTitle = this.getRankForLevel(this.progress.level);
      localStorage.setItem(PROGRESS_STORAGE_KEY, JSON.stringify(this.progress));
      this.notifyListeners();
    } catch (e) {
      console.warn('Error al guardar progreso:', e);
    }
  }

  /**
   * Añade puntos de experiencia.
   *
   * @param amount Puntos que se suman.
   * @param save Si es FALSE no persiste (para agrupar varias mutaciones en
   *   una única escritura y un único refresco del HUD).
   * @returns TRUE si el alumno ha ascendido de rango.
   */
  public addXP(amount: number, save: boolean = true): boolean {
    if (!Number.isFinite(amount) || amount <= 0) return false;

    this.progress.xp += amount;
    let leveledUp = false;

    while (this.progress.xp >= this.progress.xpToNextLevel) {
      this.progress.xp -= this.progress.xpToNextLevel;
      this.progress.level += 1;
      this.progress.xpToNextLevel = xpToNextLevelFor(this.progress.level);
      this.progress.coins += 60;
      this.progress.skillPoints = (this.progress.skillPoints || 0) + 1;
      leveledUp = true;
      try {
        EventBus.getInstance().emit('player:levelup', { newLevel: this.progress.level });
      } catch {
        // Safe fallback in isolated test environments
      }
    }

    if (save) this.saveProgress();
    return leveledUp;
  }

  public getSkillPoints(): number {
    return this.progress.skillPoints || 0;
  }

  public addSkillPoints(amount: number): void {
    if (amount <= 0) return;
    this.progress.skillPoints = (this.progress.skillPoints || 0) + amount;
    this.saveProgress();
  }

  public spendSkillPoints(amount: number = 1): boolean {
    const current = this.progress.skillPoints || 0;
    if (current >= amount && amount > 0) {
      this.progress.skillPoints = current - amount;
      this.saveProgress();
      return true;
    }
    return false;
  }

  public hasItem(itemId: string): boolean {
    return this.progress.unlockedItems.includes(itemId);
  }

  /**
   * Suma monedas.
   *
   * @param amount Monedas que se suman.
   * @param save Si es FALSE no persiste (ver `addXP`).
   */
  public addCoins(amount: number, save: boolean = true): void {
    if (!Number.isFinite(amount) || amount === 0) return;
    this.progress.coins += amount;
    if (save) this.saveProgress();
  }

  public spendCoins(amount: number): boolean {
    if (this.progress.coins >= amount) {
      this.progress.coins -= amount;
      this.saveProgress();
      return true;
    }
    return false;
  }

  public unlockItem(itemId: string): void {
    if (!this.progress.unlockedItems.includes(itemId)) {
      this.progress.unlockedItems.push(itemId);
      this.saveProgress();
    }
  }

  /**
   * Recoge una reliquia: desbloquea la reliquia y otorga su premio con una
   * ÚNICA escritura en el almacenamiento (antes se guardaba tres veces).
   */
  public unlockRelic(relicId: string): boolean {
    if (this.progress.unlockedRelics.includes(relicId)) {
      return false;
    }
    this.progress.unlockedRelics.push(relicId);
    this.addXP(150, false);
    this.addCoins(100, false);
    this.saveProgress();
    return true;
  }

  public isRelicUnlocked(relicId: string): boolean {
    return this.progress.unlockedRelics.includes(relicId);
  }

  /** TRUE si el alumno ya posee el accesorio (el "ninguno" siempre está). */
  public isItemUnlocked(itemId: string): boolean {
    if (itemId === 'none') return true;
    return this.progress.unlockedItems.includes(itemId);
  }

  /**
   * Compra un accesorio de la tienda.
   *
   * No se puede repetir la compra: si el objeto ya está comprado o no hay
   * monedas suficientes, la compra se rechaza. Al comprar bien se descuenta
   * el precio, se desbloquea el objeto y se persiste UNA sola vez.
   *
   * @returns TRUE si la compra se ha realizado.
   */
  public buyItem(itemId: string): boolean {
    const item = SHOP_ITEMS.find(candidate => candidate.id === itemId);
    if (!item) return false;
    if (this.isItemUnlocked(itemId)) return false;
    if (this.progress.coins < item.price) return false;

    this.progress.coins -= item.price;
    this.progress.unlockedItems.push(itemId);
    this.saveProgress();
    return true;
  }

  public subscribe(listener: (progress: StudentProgress) => void): () => void {
    this.listeners.push(listener);
    listener(this.progress);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notifyListeners(): void {
    this.listeners.forEach(l => l(this.progress));
  }
}
