import { EventBus } from './EventBus';
import { SaveSystem } from '../storage/SaveSystem';
import { ProfileSelectScreen } from '../storage/ProfileSelectScreen';
import { ProgressionManager } from '../gamification/ProgressionManager';

export interface BootstrapConfig {
  autoShowProfileSelect?: boolean;
}

export class GameBootstrap {
  private static instance: GameBootstrap | null = null;
  private isInitialized = false;
  private profileSelectScreen: ProfileSelectScreen | null = null;

  private constructor() {}

  public static getInstance(): GameBootstrap {
    if (!GameBootstrap.instance) {
      GameBootstrap.instance = new GameBootstrap();
    }
    return GameBootstrap.instance;
  }

  /**
   * Initializes foundational subsystems in deterministic order.
   */
  public async init(config: BootstrapConfig = {}): Promise<void> {
    if (this.isInitialized) return;

    // 1. Initialize EventBus
    EventBus.getInstance();

    // 2. Initialize SaveSystem
    const saveSystem = SaveSystem.getInstance();

    // 3. Check for existing profiles and active profile
    const profiles = saveSystem.listProfiles();
    const activeId = saveSystem.getActiveProfileId();

    if (config.autoShowProfileSelect && (profiles.length === 0 || !activeId)) {
      await this.promptProfileSelection();
    } else if (activeId) {
      this.hydrateActiveProfile(activeId);
    }

    this.isInitialized = true;
    console.log('[GameBootstrap] Core systems initialized successfully.');
  }

  public promptProfileSelection(): Promise<string> {
    return new Promise((resolve) => {
      this.profileSelectScreen = new ProfileSelectScreen((selectedProfileId) => {
        this.hydrateActiveProfile(selectedProfileId);
        resolve(selectedProfileId);
      });
      this.profileSelectScreen.show();
    });
  }

  private hydrateActiveProfile(profileId: string): void {
    const saveSystem = SaveSystem.getInstance();
    const save = saveSystem.load(profileId);

    if (save) {
      // Sync with ProgressionManager
      const progression = ProgressionManager.getInstance();
      progression.progress.level = save.progression.level;
      progression.progress.xp = save.progression.xp;
      progression.progress.xpToNextLevel = save.progression.xpToNextLevel;
      progression.progress.coins = save.progression.coins;
      progression.progress.rankTitle = save.progression.rankTitle;
      progression.progress.unlockedItems = [...save.progression.unlockedItems];
      progression.progress.unlockedRelics = [...save.progression.unlockedRelics];
      progression.progress.completedQuests = [...save.progression.completedQuests];

      // Dispatch event for other systems to hydrate
      EventBus.getInstance().emit('player:levelup', { newLevel: save.progression.level });
    }
  }

  public get ready(): boolean {
    return this.isInitialized;
  }
}
