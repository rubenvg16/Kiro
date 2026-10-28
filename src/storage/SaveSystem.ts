import { EventBus, DayPhase, WeatherState } from '../core/EventBus';
import type { StudentProgress } from '../gamification/ProgressionManager';
import type { CampaignProgress } from '../gamification/CampaignProgress';

export const SAVE_VERSION = 3;
export const MAX_PROFILES = 3;

export interface PlayerProfile {
  id: string;
  displayName: string;
  createdAt: number;
  lastPlayedAt: number;
  playtimeSeconds: number;
}

export interface NarrativeState {
  completedQuestIds: string[];
  activeQuestIds: string[];
  dialogueChoices: Record<string, string>;
  relationships: Record<string, number>;
  discoveredSecrets: string[];
}

export interface SkillTreeState {
  unlockedSkillIds: string[];
  availablePoints: number;
  spentPoints: number;
}

export interface AdaptiveState {
  recentInteractions: boolean[];
  difficultyTierOverride?: 'explorador' | 'investigador' | 'maestro';
}

export interface AudioSettings {
  musicVolume: number;
  sfxVolume: number;
}

export interface DayNightSnapshot {
  elapsedSecs: number;
  currentPhase: DayPhase;
  normalizedTime: number;
}

export interface WeatherSnapshot {
  state: WeatherState;
  nextTransitionAt: number;
}

export interface LeaderboardEntry {
  playerName: string;
  profileId: string;
  score: number;
  timestamp: number;
}

export interface LeaderboardData {
  byMinigame: Record<string, LeaderboardEntry[]>;
}

export interface GameSave {
  version: number;
  profile: PlayerProfile;
  progression: StudentProgress;
  campaign: CampaignProgress;
  narrative: NarrativeState;
  skillTree: SkillTreeState;
  questSystem: {
    activeQuestIds: string[];
    completedQuestIds: string[];
    dailyQuestDate: string;
  };
  adaptive: AdaptiveState;
  audio: AudioSettings;
  dayNight: DayNightSnapshot;
  weather: WeatherSnapshot;
  achievements: string[];
  leaderboard: LeaderboardData;
}

export interface ProfileSummary {
  profile: PlayerProfile;
  rank: string;
  totalXP: number;
  questsCompleted: number;
  playtimeLabel: string;
}

interface ProfilesIndex {
  activeProfileId: string | null;
  profileIds: string[];
}

export class SaveSystem {
  private static instance: SaveSystem | null = null;
  private activeProfileId: string | null = null;
  private autoSaveTimer: any = null;
  private activeSaveCache: GameSave | null = null;

  public static readonly INDEX_KEY = 'kiro_profiles_index';

  private constructor() {
    this.initProfiles();
    this.wireAutoSaveEvents();
  }

  public static getInstance(): SaveSystem {
    if (!SaveSystem.instance) {
      SaveSystem.instance = new SaveSystem();
    }
    return SaveSystem.instance;
  }

  public static resetInstance(): void {
    SaveSystem.instance = null;
  }

  private initProfiles(): void {
    try {
      const index = this.readIndex();
      this.activeProfileId = index.activeProfileId;
      if (!this.activeProfileId && index.profileIds.length > 0) {
        this.activeProfileId = index.profileIds[0];
        this.writeIndex({ ...index, activeProfileId: this.activeProfileId });
      }
    } catch (e) {
      console.warn('[SaveSystem] Unable to read profile index, defaulting:', e);
    }
  }

  private wireAutoSaveEvents(): void {
    const bus = EventBus.getInstance();
    const trigger = () => this.autoSave();

    bus.on('quest:completed', trigger);
    bus.on('level:completed', trigger);
    bus.on('puzzle:completed', trigger);
    bus.on('zone:entered', trigger);
  }

  public storageKey(profileId: string): string {
    return `kiro_save_v3_profile_${profileId}`;
  }

  public getActiveProfileId(): string | null {
    return this.activeProfileId;
  }

  public setActiveProfileId(profileId: string): void {
    const index = this.readIndex();
    if (index.profileIds.includes(profileId)) {
      this.activeProfileId = profileId;
      this.activeSaveCache = null;
      this.writeIndex({ ...index, activeProfileId: profileId });
    }
  }

  public listProfiles(): ProfileSummary[] {
    const index = this.readIndex();
    const summaries: ProfileSummary[] = [];

    for (const id of index.profileIds) {
      const save = this.load(id);
      if (save) {
        const totalMinutes = Math.floor(save.profile.playtimeSeconds / 60);
        const hours = Math.floor(totalMinutes / 60);
        const mins = totalMinutes % 60;

        summaries.push({
          profile: save.profile,
          rank: save.progression.rankTitle || 'Novato',
          totalXP: save.progression.xp || 0,
          questsCompleted: save.narrative.completedQuestIds.length,
          playtimeLabel: `${hours}h ${mins}m`
        });
      }
    }

    return summaries;
  }

  public createProfile(displayName: string): PlayerProfile {
    const index = this.readIndex();
    if (index.profileIds.length >= MAX_PROFILES) {
      throw new Error(`Maximum profiles limit (${MAX_PROFILES}) reached.`);
    }

    const id = `profile_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const now = Date.now();
    const profile: PlayerProfile = {
      id,
      displayName: displayName.trim() || 'Estudiante',
      createdAt: now,
      lastPlayedAt: now,
      playtimeSeconds: 0
    };

    const initialSave = this.createDefaultSave(id, profile.displayName);
    initialSave.profile = profile;

    this.writeSave(id, initialSave);
    index.profileIds.push(id);
    index.activeProfileId = id;
    this.writeIndex(index);

    this.activeProfileId = id;
    this.activeSaveCache = initialSave;
    return profile;
  }

  public deleteProfile(profileId: string): boolean {
    const index = this.readIndex();
    const existingIdx = index.profileIds.indexOf(profileId);
    if (existingIdx === -1) return false;

    index.profileIds.splice(existingIdx, 1);
    try {
      localStorage.removeItem(this.storageKey(profileId));
    } catch (e) {
      console.warn('[SaveSystem] localStorage.removeItem failed:', e);
    }

    if (this.activeProfileId === profileId) {
      this.activeProfileId = index.profileIds[0] || null;
      this.activeSaveCache = null;
      index.activeProfileId = this.activeProfileId;
    }

    this.writeIndex(index);
    return true;
  }

  public load(profileId?: string): GameSave {
    const id = profileId || this.activeProfileId;
    if (!id) {
      return this.createDefaultSave('default', 'Estudiante');
    }

    try {
      const raw = localStorage.getItem(this.storageKey(id));
      if (!raw) {
        const fallback = this.createDefaultSave(id, 'Estudiante');
        this.writeSave(id, fallback);
        return fallback;
      }

      let parsed: any;
      try {
        parsed = JSON.parse(raw);
      } catch (parseError) {
        console.warn(`[SaveSystem] Corrupt JSON found for profile ${id}, falling back to default save:`, parseError);
        const fallback = this.createDefaultSave(id, 'Estudiante');
        this.writeSave(id, fallback);
        return fallback;
      }

      if (!parsed || typeof parsed !== 'object') {
        const fallback = this.createDefaultSave(id, 'Estudiante');
        this.writeSave(id, fallback);
        return fallback;
      }

      const version = typeof parsed.version === 'number' ? parsed.version : 1;
      const save = version < SAVE_VERSION ? this.migrate(parsed, version) : this.sanitizeSave(parsed, id);

      if (id === this.activeProfileId) {
        this.activeSaveCache = save;
      }
      return save;
    } catch (e) {
      console.warn(`[SaveSystem] Unexpected error loading profile ${id}:`, e);
      return this.createDefaultSave(id, 'Estudiante');
    }
  }

  public save(data: Partial<GameSave>, profileId?: string): void {
    let id = profileId || this.activeProfileId;
    if (!id) {
      const existing = this.readIndex().profileIds;
      if (existing.length > 0) {
        id = existing[0];
        this.activeProfileId = id;
      } else {
        id = this.createProfile('Estudiante').id;
      }
    }

    const current = this.load(id);
    const updated: GameSave = {
      ...current,
      ...data,
      profile: {
        ...current.profile,
        ...(data.profile || {}),
        lastPlayedAt: Date.now()
      },
      version: SAVE_VERSION
    };

    this.writeSave(id, updated);
    if (id === this.activeProfileId) {
      this.activeSaveCache = updated;
    }
  }

  public autoSave(): void {
    if (this.autoSaveTimer) {
      clearTimeout(this.autoSaveTimer);
    }

    this.autoSaveTimer = setTimeout(() => {
      if (this.activeProfileId && this.activeSaveCache) {
        this.save(this.activeSaveCache, this.activeProfileId);
      }
    }, 500);
  }

  public exportProfile(profileId?: string): string {
    const id = profileId || this.activeProfileId;
    if (!id) return '{}';

    const save = this.load(id);
    const json = JSON.stringify(save, null, 2);

    if (typeof window !== 'undefined' && typeof document !== 'undefined') {
      try {
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `kiro_save_${id}_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } catch (err) {
        console.warn('[SaveSystem] Automatic download trigger failed, returning JSON string:', err);
      }
    }

    return json;
  }

  public migrate(raw: any, fromVersion: number): GameSave {
    const defaults = this.createDefaultSave(
      raw?.profile?.id || 'migrated_profile',
      raw?.profile?.displayName || 'Estudiante'
    );

    if (fromVersion <= 1) {
      // V1 migration (legacy individual keys or basic format)
      const prog = raw.progression || {};
      const camp = raw.campaign || {};

      return {
        ...defaults,
        version: SAVE_VERSION,
        progression: {
          ...defaults.progression,
          level: typeof prog.level === 'number' ? prog.level : defaults.progression.level,
          xp: typeof prog.xp === 'number' ? prog.xp : defaults.progression.xp,
          coins: typeof prog.coins === 'number' ? prog.coins : defaults.progression.coins,
          rankTitle: prog.rankTitle || defaults.progression.rankTitle,
          unlockedItems: Array.isArray(prog.unlockedItems) ? prog.unlockedItems : defaults.progression.unlockedItems,
          unlockedRelics: Array.isArray(prog.unlockedRelics) ? prog.unlockedRelics : defaults.progression.unlockedRelics,
          completedQuests: Array.isArray(prog.completedQuests) ? prog.completedQuests : defaults.progression.completedQuests
        },
        campaign: {
          unlocked: Array.isArray(camp.unlocked) ? camp.unlocked : defaults.campaign.unlocked,
          results: (camp.results && typeof camp.results === 'object') ? camp.results : defaults.campaign.results
        }
      };
    }

    if (fromVersion === 2) {
      // V2 migration
      return {
        ...defaults,
        ...raw,
        version: SAVE_VERSION,
        profile: {
          ...defaults.profile,
          ...(raw.profile || {})
        },
        progression: {
          ...defaults.progression,
          ...(raw.progression || {})
        },
        campaign: {
          ...defaults.campaign,
          ...(raw.campaign || {})
        },
        narrative: {
          ...defaults.narrative,
          ...(raw.narrative || {})
        },
        skillTree: {
          ...defaults.skillTree,
          ...(raw.skillTree || {})
        },
        questSystem: {
          ...defaults.questSystem,
          ...(raw.questSystem || {})
        },
        adaptive: {
          ...defaults.adaptive,
          ...(raw.adaptive || {})
        },
        audio: {
          ...defaults.audio,
          ...(raw.audio || {})
        },
        dayNight: {
          ...defaults.dayNight,
          ...(raw.dayNight || {})
        },
        weather: {
          ...defaults.weather,
          ...(raw.weather || {})
        },
        achievements: Array.isArray(raw.achievements) ? raw.achievements : defaults.achievements,
        leaderboard: {
          byMinigame: (raw.leaderboard && typeof raw.leaderboard.byMinigame === 'object')
            ? raw.leaderboard.byMinigame
            : defaults.leaderboard.byMinigame
        }
      };
    }

    return this.sanitizeSave(raw, raw?.profile?.id || 'default');
  }

  public createDefaultSave(profileId = 'default', displayName = 'Estudiante'): GameSave {
    const now = Date.now();
    return {
      version: SAVE_VERSION,
      profile: {
        id: profileId,
        displayName,
        createdAt: now,
        lastPlayedAt: now,
        playtimeSeconds: 0
      },
      progression: {
        level: 1,
        xp: 0,
        xpToNextLevel: 100,
        coins: 0,
        rankTitle: 'Estudiante Novato',
        unlockedItems: [],
        unlockedRelics: [],
        completedQuests: []
      },
      campaign: {
        unlocked: ['patio'],
        results: {}
      },
      narrative: {
        completedQuestIds: [],
        activeQuestIds: [],
        dialogueChoices: {},
        relationships: {},
        discoveredSecrets: []
      },
      skillTree: {
        unlockedSkillIds: [],
        availablePoints: 0,
        spentPoints: 0
      },
      questSystem: {
        activeQuestIds: [],
        completedQuestIds: [],
        dailyQuestDate: ''
      },
      adaptive: {
        recentInteractions: []
      },
      audio: {
        musicVolume: 0.8,
        sfxVolume: 0.8
      },
      dayNight: {
        elapsedSecs: 0,
        currentPhase: 'morning',
        normalizedTime: 0
      },
      weather: {
        state: 'clear',
        nextTransitionAt: 300
      },
      achievements: [],
      leaderboard: {
        byMinigame: {}
      }
    };
  }

  private sanitizeSave(raw: any, profileId: string): GameSave {
    const defaults = this.createDefaultSave(profileId, raw?.profile?.displayName || 'Estudiante');
    return {
      version: SAVE_VERSION,
      profile: {
        ...defaults.profile,
        ...(raw.profile || {})
      },
      progression: {
        ...defaults.progression,
        ...(raw.progression || {})
      },
      campaign: {
        ...defaults.campaign,
        ...(raw.campaign || {})
      },
      narrative: {
        ...defaults.narrative,
        ...(raw.narrative || {})
      },
      skillTree: {
        ...defaults.skillTree,
        ...(raw.skillTree || {})
      },
      questSystem: {
        ...defaults.questSystem,
        ...(raw.questSystem || {})
      },
      adaptive: {
        ...defaults.adaptive,
        ...(raw.adaptive || {})
      },
      audio: {
        ...defaults.audio,
        ...(raw.audio || {})
      },
      dayNight: {
        ...defaults.dayNight,
        ...(raw.dayNight || {})
      },
      weather: {
        ...defaults.weather,
        ...(raw.weather || {})
      },
      achievements: Array.isArray(raw.achievements) ? raw.achievements : defaults.achievements,
      leaderboard: {
        byMinigame: (raw.leaderboard && typeof raw.leaderboard.byMinigame === 'object')
          ? raw.leaderboard.byMinigame
          : defaults.leaderboard.byMinigame
      }
    };
  }

  private readIndex(): ProfilesIndex {
    try {
      const raw = localStorage.getItem(SaveSystem.INDEX_KEY);
      if (!raw) return { activeProfileId: null, profileIds: [] };
      const parsed = JSON.parse(raw);
      return {
        activeProfileId: parsed.activeProfileId || null,
        profileIds: Array.isArray(parsed.profileIds) ? parsed.profileIds : []
      };
    } catch (e) {
      return { activeProfileId: null, profileIds: [] };
    }
  }

  private writeIndex(index: ProfilesIndex): void {
    try {
      localStorage.setItem(SaveSystem.INDEX_KEY, JSON.stringify(index));
    } catch (e) {
      console.warn('[SaveSystem] writeIndex failed:', e);
    }
  }

  private writeSave(profileId: string, save: GameSave): void {
    try {
      localStorage.setItem(this.storageKey(profileId), JSON.stringify(save));
    } catch (e) {
      console.warn(`[SaveSystem] writeSave failed for profile ${profileId}:`, e);
    }
  }
}
