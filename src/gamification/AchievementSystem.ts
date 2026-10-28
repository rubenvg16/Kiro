import { Achievement, ACHIEVEMENT_DEFINITIONS } from './AchievementDefinitions';
import { EventBus } from '../core/EventBus';
import { SaveSystem } from '../storage/SaveSystem';
import { ProgressionManager } from './ProgressionManager';

export class AchievementSystem {
  private static instance: AchievementSystem | null = null;
  private unlockedIds: Set<string> = new Set();
  private progressCounters: Map<string, number> = new Map();

  private constructor() {
    this.hydrateFromStorage();
    this.subscribeToEvents();
  }

  public static getInstance(): AchievementSystem {
    if (!AchievementSystem.instance) {
      AchievementSystem.instance = new AchievementSystem();
    }
    return AchievementSystem.instance;
  }

  public static resetInstance(): void {
    AchievementSystem.instance = null;
  }

  private hydrateFromStorage(): void {
    try {
      const save = SaveSystem.getInstance().load();
      if (save && Array.isArray(save.achievements)) {
        this.unlockedIds = new Set(save.achievements);
      }
    } catch {
      this.unlockedIds = new Set();
    }
  }

  private subscribeToEvents(): void {
    const bus = EventBus.getInstance();

    bus.on('quest:completed', (data) => {
      this.incrementCounter('quest', 1);
      if (data.questId) {
        this.checkDirectUnlock(data.questId);
        if (data.questId.startsWith('daily_')) {
          this.checkDirectUnlock('daily_challenge');
        }
      }
      this.checkAll();
    });

    bus.on('puzzle:completed', (data) => {
      this.incrementCounter('puzzle', 1);
      if (data.perfect) {
        this.incrementCounter('gold_medal', 1);
      }
      if (data.puzzleId) {
        this.checkDirectUnlock(data.puzzleId);
        // Check historical figures achievements
        if (data.puzzleId.includes('cajal')) this.checkDirectUnlock('figure_cajal');
        if (data.puzzleId.includes('cervantes')) this.checkDirectUnlock('figure_cervantes');
        if (data.puzzleId.includes('balance') || data.puzzleId.includes('pitagoras')) this.checkDirectUnlock('figure_pitagoras');
        if (data.puzzleId.includes('ada')) this.checkDirectUnlock('figure_ada_lovelace');
        if (data.puzzleId.includes('hypatia')) this.checkDirectUnlock('figure_hipatia');
        if (data.puzzleId.includes('curie')) this.checkDirectUnlock('figure_marie_curie');
      }
      this.checkAll();
    });

    bus.on('puzzle:answered', (data) => {
      if (data.correct) {
        this.incrementCounter('quiz_correct', 1);
        this.checkAll();
      }
    });

    bus.on('zone:entered', (data) => {
      this.incrementCounter('zone', 1);
      if (data.zoneId === 'tejado_secreto') {
        this.checkDirectUnlock('tejado_secreto');
      }
      this.checkAll();
    });

    bus.on('collectible:picked', () => {
      this.incrementCounter('collectible', 1);
      this.checkAll();
    });

    bus.on('player:levelup', (data) => {
      this.setCounter('player_level', data.newLevel);
      this.checkAll();
    });

    bus.on('minigame:ended', (data) => {
      if (data.isNewBest) {
        this.incrementCounter('minigame_record', 1);
        this.checkAll();
      }
    });

    bus.on('npc:relationshipChanged', (data) => {
      if (data.score >= 50) {
        this.checkDirectUnlock('relationship_50');
      }
    });
  }

  public incrementCounter(key: string, amount: number = 1): void {
    const current = this.progressCounters.get(key) || 0;
    this.progressCounters.set(key, current + amount);
  }

  public setCounter(key: string, value: number): void {
    this.progressCounters.set(key, value);
  }

  public getCounter(key: string): number {
    return this.progressCounters.get(key) || 0;
  }

  public isUnlocked(achievementId: string): boolean {
    return this.unlockedIds.has(achievementId);
  }

  public checkDirectUnlock(referenceId: string): void {
    for (const ach of ACHIEVEMENT_DEFINITIONS) {
      if (!this.unlockedIds.has(ach.id) && ach.condition.referenceId === referenceId) {
        this.unlock(ach.id);
      }
    }
  }

  public checkAll(): void {
    const progression = ProgressionManager.getInstance();
    const playerLevel = progression.progress.level;
    this.setCounter('player_level', playerLevel);

    for (const ach of ACHIEVEMENT_DEFINITIONS) {
      if (this.unlockedIds.has(ach.id)) continue;

      const cond = ach.condition;
      let shouldUnlock = false;

      if (cond.type === 'count') {
        const val = this.getCounter(cond.referenceId || '');
        if (val >= cond.threshold) shouldUnlock = true;
      } else if (cond.type === 'reach') {
        if (cond.referenceId === 'player_level') {
          if (playerLevel >= cond.threshold) shouldUnlock = true;
        } else if (cond.referenceId === 'relationship') {
          const rel = this.getCounter('relationship');
          if (rel >= cond.threshold) shouldUnlock = true;
        }
      }

      if (shouldUnlock) {
        this.unlock(ach.id);
      }
    }
  }

  public unlock(achievementId: string): boolean {
    if (this.unlockedIds.has(achievementId)) return false;

    const ach = ACHIEVEMENT_DEFINITIONS.find((a) => a.id === achievementId);
    if (!ach) return false;

    this.unlockedIds.add(achievementId);

    // Award coins (20 - 200)
    ProgressionManager.getInstance().addCoins(ach.coinReward);

    // Show 3-second toast notification
    this.showToast(ach);

    // Persist to SaveSystem
    this.persist();

    // Emit event
    EventBus.getInstance().emit('achievement:unlocked', { achievementId });
    return true;
  }

  public getProgress(achievementId: string): number {
    if (this.unlockedIds.has(achievementId)) return 1.0;

    const ach = ACHIEVEMENT_DEFINITIONS.find((a) => a.id === achievementId);
    if (!ach) return 0;

    const cond = ach.condition;
    if (cond.type === 'count' && cond.referenceId) {
      const val = this.getCounter(cond.referenceId);
      return Math.min(1.0, val / Math.max(1, cond.threshold));
    }
    if (cond.type === 'reach' && cond.referenceId === 'player_level') {
      const level = ProgressionManager.getInstance().progress.level;
      return Math.min(1.0, level / Math.max(1, cond.threshold));
    }

    return 0;
  }

  private showToast(achievement: Achievement): void {
    if (typeof document === 'undefined') return;

    const toast = document.createElement('div');
    toast.className = 'achievement-toast';
    toast.style.position = 'fixed';
    toast.style.bottom = '24px';
    toast.style.right = '24px';
    toast.style.background = 'linear-gradient(135deg, #1e293b, #0f172a)';
    toast.style.border = '2px solid #f59e0b';
    toast.style.color = '#fff';
    toast.style.padding = '12px 18px';
    toast.style.borderRadius = '10px';
    toast.style.boxShadow = '0 8px 24px rgba(0,0,0,0.5)';
    toast.style.zIndex = '99999';
    toast.style.display = 'flex';
    toast.style.alignItems = 'center';
    toast.style.gap = '12px';
    toast.style.transition = 'all 0.3s ease';

    toast.innerHTML = `
      <div style="font-size: 2rem;">${achievement.icon}</div>
      <div>
        <div style="font-size: 0.75rem; text-transform: uppercase; color: #f59e0b; font-weight: bold;">
          ¡Logro Desbloqueado! (+${achievement.coinReward} 🪙)
        </div>
        <strong style="font-size: 1rem;">${achievement.title}</strong>
        <p style="margin: 0; font-size: 0.8rem; color: #cbd5e1;">${achievement.description}</p>
      </div>
    `;

    document.body.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(15px)';
      setTimeout(() => toast.remove(), 400);
    }, 3000); // 3-second toast (Req 14.2)
  }

  public serialize(): string[] {
    return Array.from(this.unlockedIds);
  }

  public hydrate(ids: string[]): void {
    if (Array.isArray(ids)) {
      this.unlockedIds = new Set(ids);
    }
    this.persist();
  }

  private persist(): void {
    try {
      SaveSystem.getInstance().save({
        achievements: Array.from(this.unlockedIds)
      });
    } catch {
      // Safe fallback
    }
  }
}
