export interface StudentProgress {
  level: number;
  xp: number;
  xpToNextLevel: number;
  coins: number;
  rankTitle: string;
  unlockedItems: string[];
  unlockedRelics: string[];
  completedQuests: string[];
}

export interface RelicMeta {
  id: string;
  name: string;
  icon: string;
  locationHint: string;
  rewardDescription: string;
}

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

  private getRankForLevel(level: number): string {
    const match = [...RANKS].reverse().find(r => level >= r.level);
    return match ? match.title : 'Novato del Recreo';
  }

  private loadProgress(): StudentProgress {
    try {
      const saved = localStorage.getItem(PROGRESS_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (!parsed.unlockedRelics) parsed.unlockedRelics = [];
        parsed.rankTitle = this.getRankForLevel(parsed.level);
        return parsed;
      }
    } catch (e) {
      console.warn('Error al cargar progreso:', e);
    }

    return {
      level: 1,
      xp: 0,
      xpToNextLevel: 120,
      coins: 50,
      rankTitle: 'Novato del Recreo',
      unlockedItems: ['none', 'glasses', 'cap', 'backpack'],
      unlockedRelics: [],
      completedQuests: []
    };
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

  public addXP(amount: number): boolean {
    this.progress.xp += amount;
    let leveledUp = false;

    while (this.progress.xp >= this.progress.xpToNextLevel) {
      this.progress.xp -= this.progress.xpToNextLevel;
      this.progress.level += 1;
      this.progress.xpToNextLevel = Math.round(this.progress.xpToNextLevel * 1.6);
      this.progress.coins += 60;
      leveledUp = true;
    }

    this.saveProgress();
    return leveledUp;
  }

  public addCoins(amount: number): void {
    this.progress.coins += amount;
    this.saveProgress();
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

  public unlockRelic(relicId: string): boolean {
    if (!this.progress.unlockedRelics.includes(relicId)) {
      this.progress.unlockedRelics.push(relicId);
      this.addXP(150);
      this.addCoins(100);
      this.saveProgress();
      return true;
    }
    return false;
  }

  public isRelicUnlocked(relicId: string): boolean {
    return this.progress.unlockedRelics.includes(relicId);
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
