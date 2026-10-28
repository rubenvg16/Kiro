# Design Document — Complete Game Expansion

## Overview

This document covers the technical design for the full expansion of the existing TypeScript + Three.js + Vite educational game. The codebase already ships `CharacterController`, `PhysicsWorld`, `SceneManager`, `LevelBuilder`, `LevelManager` (5 levels), `NPCManager`, `PlayerController`, `CollectiblesManager`, `SecretRelicsManager`, `HistoricalFiguresManager`, `PuzzleEngine`, `CurriculumService`, `ProgressionManager`, `CampaignProgress`, `AvatarModel`, and `AvatarStorage`.

The expansion adds twelve new systems without breaking existing ones. Every new system is a singleton class (matching the project convention) that wires into existing singletons via constructor injection or lazy `getInstance()` calls. No existing public API is removed; all changes are additive.

---

## Architecture

### High-Level Module Graph

```
main.ts
 ├── SceneManager          (existing — extended with Zone lighting + DayNight hooks)
 ├── PhysicsWorld          (existing — extended with friction multiplier API)
 ├── PlayerController      (existing)
 ├── CharacterController   (existing)
 ├── InputManager          (existing)
 ├── FollowCamera          (existing)
 │
 ├── WorldMap / ZoneManager        (NEW)
 │    └── 8 Zone configs
 │
 ├── DialogueSystem                (NEW)
 │    └── NarrativeState (persisted via SaveSystem)
 │
 ├── QuestSystem                   (NEW)
 │    └── QuestChain + DailyChallenge generator
 │
 ├── NPCManager            (existing — extended with RelationshipScore + rich dialogues)
 ├── HistoricalFiguresManager  (existing — extended to 6 figures × 4 dialogues)
 │
 ├── PuzzleEngine          (existing — extended: HybridChallenge, difficulty, timer, medals)
 │    └── CurriculumService (existing)
 │
 ├── AdaptiveDifficulty            (NEW)
 │
 ├── LevelManager          (existing — extended: 15 levels, unique mechanics)
 ├── LevelBuilder          (existing — extended: HybridChallenge gates, emissive materials)
 │
 ├── MinigameManager               (NEW)
 │    └── 6 Minigame implementations
 │
 ├── SkillTree                     (NEW) ──► ProgressionManager
 │
 ├── Shop (extended ProgressionManager.SHOP_ITEMS → 20 items, 4 categories)
 │
 ├── AudioManager                  (NEW)
 ├── DayNightCycle                 (NEW) ──► SceneManager
 ├── WeatherSystem                 (NEW) ──► PhysicsWorld, SceneManager
 │
 ├── SaveSystem                    (NEW — replaces ad-hoc localStorage calls)
 │    └── 3 Player Profiles
 │
 ├── AchievementSystem             (NEW)
 ├── Leaderboard                   (NEW)
 │
 └── HUD (extended: minimap, DifficultyTier badge, SkillPoints, DayNight icon)
```

### Design Patterns Used

| Pattern | Where applied |
|---|---|
| **Singleton** | All manager/system classes (matches existing convention) |
| **Observer / Event Bus** | `EventBus` used by SaveSystem, AchievementSystem, QuestSystem, AudioManager |
| **Strategy** | `Minigame` interface — each of the 6 minigames is a concrete strategy |
| **State Machine** | `QuestState`, `DayNightPhase`, `WeatherState` transitions |
| **Command** | `DialogueChoice` — each option is a command with recorded side-effects |
| **Decorator** | `AdaptiveDifficulty` wraps `PuzzleEngine` parameter calculation |
| **Repository** | `SaveSystem` abstracts all localStorage reads/writes behind a versioned API |
| **Factory** | `ZoneFactory` builds Zone scenes from data-driven `ZoneDefinition` objects |

---

## Components and Interfaces

### EventBus

Lightweight typed event bus that decouples all systems.

```typescript
// src/core/EventBus.ts

type EventMap = {
  'quest:completed':           { questId: string; xp: number; coins: number };
  'quest:accepted':            { questId: string };
  'puzzle:completed':          { puzzleId: string; score: number; perfect: boolean };
  'puzzle:answered':           { correct: boolean };
  'zone:entered':              { zoneId: ZoneId };
  'zone:unlocked':             { zoneId: ZoneId };
  'achievement:unlocked':      { achievementId: string };
  'collectible:picked':        { collectibleId: string };
  'level:completed':           { levelId: string; stars: number };
  'player:levelup':            { newLevel: number };
  'minigame:ended':            { minigameId: string; score: number; isNewBest: boolean };
  'weather:changed':           { state: WeatherState };
  'daycycle:phaseChanged':     { phase: DayPhase };
  'npc:relationshipChanged':   { npcId: string; score: number };
};

export class EventBus {
  private static instance: EventBus;
  private handlers: Partial<{ [K in keyof EventMap]: Array<(d: EventMap[K]) => void> }> = {};

  static getInstance(): EventBus { /* ... */ }
  on<K extends keyof EventMap>(event: K, handler: (data: EventMap[K]) => void): () => void { /* ... */ }
  emit<K extends keyof EventMap>(event: K, data: EventMap[K]): void { /* ... */ }
}
```

---

### ZoneManager

```typescript
// src/world/ZoneManager.ts

export type ZoneId =
  | 'patio_central' | 'biblioteca' | 'laboratorio' | 'pista_deportiva'
  | 'huerto_escolar' | 'sala_informatica' | 'pasillo_historia' | 'tejado_secreto';

export interface ZoneDefinition {
  id: ZoneId;
  displayName: string;
  description: string;
  ambientColor: number;
  fogColor: number;
  fogNear: number;
  fogFar: number;
  spawnPoint: THREE.Vector3;
  adjacentZones: ZoneId[];
  unlockCondition?: ZoneUnlockCondition;
  pointsOfInterest: PointOfInterest[];
  ambientSoundId: string;
  musicTrackId: string;
}

export interface ZoneUnlockCondition {
  type: 'quest' | 'level' | 'item';
  referenceId: string;
  displayHint: string;
}

export interface PointOfInterest {
  id: string;
  worldPosition: THREE.Vector3;
  type: 'npc' | 'puzzle' | 'collectible' | 'relic' | 'minigame' | 'secret';
}

export class ZoneManager {
  private static instance: ZoneManager;
  private currentZone: ZoneId | null = null;
  private exploredZones: Set<ZoneId> = new Set();
  private unlockedZones: Set<ZoneId> = new Set();

  static getInstance(): ZoneManager { /* ... */ }

  /** Attempts seamless transition; returns false if the zone is locked. */
  async transitionTo(zoneId: ZoneId): Promise<boolean> { /* ... */ }

  isUnlocked(zoneId: ZoneId): boolean { /* ... */ }
  getUnlockMessage(zoneId: ZoneId): string { /* ... */ }
  getCurrentZone(): ZoneId | null { /* ... */ }
  getExploredZones(): ZoneId[] { /* ... */ }
}
```

Transitions fade the scene, swap geometry via `SceneManager`, apply zone-specific lighting via `SceneManager.applyZoneEnvironment(zone)`, and cross-fade the `AudioManager` track — no blocking loading screen. A progress overlay reflects real asset loading progress (Req 15.8). At least 25 `PointOfInterest` objects are distributed across the 8 zones (Req 1.6).

---

### DialogueSystem and NarrativeState

```typescript
// src/world/DialogueSystem.ts

export interface DialogueLine {
  speakerId: string;
  text: string;
  portrait?: string;
}

export interface DialogueCondition {
  type: 'relationship' | 'quest' | 'item' | 'level';
  referenceId: string;
  operator: '>=' | '<=' | '==' | '!=';
  value: number | string | boolean;
}

export interface DialogueSideEffect {
  type: 'startQuest' | 'modifyRelationship' | 'giveItem' | 'unlockZone';
  payload: unknown;
}

export interface DialogueChoice {
  text: string;
  nextNodeId: string;
  condition?: DialogueCondition;
  sideEffect?: DialogueSideEffect;
}

export interface DialogueNode {
  id: string;
  lines: DialogueLine[];
  choices?: DialogueChoice[];
  autoAdvanceAfterMs?: number;
}

export interface DialogueTree {
  npcId: string;
  rootNodeId: string;
  nodes: Record<string, DialogueNode>;
}

export interface NpcRelationship {
  npcId: string;
  score: number;   // clamped [-100, +100]
}

export interface NarrativeState {
  version: number;
  mainQuestProgress: number;
  completedQuestIds: string[];
  activeQuestIds: string[];
  dialogueChoices: Record<string, string>;
  relationships: NpcRelationship[];
  discoveredSecrets: string[];
}

export class DialogueSystem {
  private static instance: DialogueSystem;
  private isActive = false;
  private currentTree: DialogueTree | null = null;
  private currentNodeId: string | null = null;
  private lineIndex = 0;
  private typewriterHandle = -1;

  static getInstance(): DialogueSystem { /* ... */ }

  startDialogue(npcId: string): void { /* ... */ }
  advanceLine(): void { /* ... */ }
  selectChoice(choiceIndex: number): void { /* ... */ }
  isDialogueActive(): boolean { return this.isActive; }
  getRelationshipScore(npcId: string): number { /* ... */ }
  modifyRelationship(npcId: string, delta: number): void { /* clamps to [-100,100] */ }
}
```

Typewriter renders at 40 characters/second (Req 3.4) using `setInterval`. While active, `PlayerController.setMovementEnabled(false)` is called and `AudioManager.duckMusic(0.4)` lowers BGM by 60% (Req 11.8).

---

### QuestSystem

```typescript
// src/quests/QuestSystem.ts

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
  quests: string[];
}

export class QuestSystem {
  private static instance: QuestSystem;
  private activeQuests: Map<string, Quest> = new Map();
  private completedQuestIds: Set<string> = new Set();

  static getInstance(): QuestSystem { /* ... */ }

  acceptQuest(questId: string): boolean { /* ... */ }
  updateObjective(questId: string, objectiveId: string, progress: number): void { /* ... */ }
  checkCompletion(questId: string): void { /* ... */ }
  generateDailyChallenge(): Quest { /* uses CurriculumService */ }
  getActiveQuests(): Quest[] { /* ... */ }
  getCompletedQuests(): Quest[] { /* ... */ }
  isVisible(quest: Quest): boolean { /* prerequisite check */ }
}
```

The main `QuestChain` "El Gran Certamen del IES" contains 12 quests spanning all 8 Zones. Two secondary chains ("Misterio en la Biblioteca", "Reto Deportivo") each contain 5 quests. `DailyChallenge` quests generate from `CurriculumService` at midnight local time, stored via `lastDailyDate` in `SaveSystem` (Req 6.5–6.6).

---

### PuzzleEngine Extensions (HybridChallenge)

```typescript
// src/puzzles/types.ts (new file)

export type PuzzleDifficulty = 'easy' | 'medium' | 'hard';
export type PhaseType = 'mechanical' | 'quiz';

export interface PuzzlePhase {
  type: PhaseType;
  parTimeSeconds: number;
  content: MechanicalPhaseContent | QuizPhaseContent;
}

export interface MechanicalPhaseContent {
  mechanic: 'platforming' | 'balance' | 'cipher' | 'sequence' | 'maze';
  obstacleCount: number;
}

export interface QuizPhaseContent {
  question: string;
  correctAnswer: string;
  distractors: string[];
  explanation: string;
  subject: string;
  difficulty: PuzzleDifficulty;
}

export interface HybridChallenge {
  id: string;
  title: string;
  phases: PuzzlePhase[];   // min 2 mechanical + 2 quiz, alternating
  difficulty: PuzzleDifficulty;
  parTimeSeconds: number;
}

export interface PuzzleSession {
  challengeId: string;
  phaseIndex: number;
  startTime: number;
  baseScore: number;
  xpPotential: number;
  coinPotential: number;
}
```

New methods on `PuzzleEngine`:

```typescript
// Additions to src/puzzles/PuzzleEngine.ts
launchHybridChallenge(challenge: HybridChallenge): void { /* ... */ }
setDifficulty(diff: PuzzleDifficulty): void { /* ... */ }
getBestScore(puzzleId: string): number | null { /* reads SaveSystem */ }
awardGoldMedal(puzzleId: string): void { /* ... */ }
```

Scoring: every 30 seconds over par deducts 10% (Req 4.3). Wrong answers deduct 20 XP from potential without ending the session (Req 4.5). A Three.js `PointsMaterial` particle burst fires on correct answers (Req 4.4).

---

### AdaptiveDifficulty

```typescript
// src/puzzles/AdaptiveDifficulty.ts

export interface InteractionRecord {
  timestamp: number;
  correct: boolean;
}

export interface AdaptiveState {
  windowSize: 10;
  recentInteractions: InteractionRecord[];
  hintsEnabled: boolean;
  timerReductionFactor: number;  // 1.0 = no reduction; 0.8 = 20% off
  xpMultiplier: number;          // 1.0 = full; 0.7 = 30% reduced
}

export class AdaptiveDifficulty {
  private static instance: AdaptiveDifficulty;

  static getInstance(): AdaptiveDifficulty { /* ... */ }

  recordInteraction(correct: boolean): void { /* ... */ }
  getSuccessRate(): number { /* trueCount / max(1, interactions.length) */ }
  getAdjustedTimer(baseSecs: number): number { /* ... */ }
  getXpMultiplier(): number { /* ... */ }
  shouldShowHint(): boolean { /* ... */ }
  serialize(): AdaptiveState { /* ... */ }
  hydrate(state: AdaptiveState): void { /* ... */ }
}
```

Rate < 40% → `hintsEnabled = true`, `timerReductionFactor = 0.8`. Rate > 85% → `xpMultiplier = 0.7` and harder questions from `CurriculumService` (Req 5.4–5.5).

---

### MinigameManager

```typescript
// src/minigames/MinigameManager.ts

export interface MinigameDefinition {
  id: string;
  displayName: string;
  description: string;
  rules: string;
  controls: string;
  unlockQuestId?: string;
}

export interface MinigameResult {
  minigameId: string;
  score: number;
  durationMs: number;
  isNewBest: boolean;
  xpEarned: number;
  coinsEarned: number;   // +25 if new best (Req 8.5)
}

// Strategy interface
export interface Minigame {
  readonly definition: MinigameDefinition;
  start(container: HTMLElement): void;
  end(): MinigameResult;
  dispose(): void;
}

export class MinigameManager {
  private static instance: MinigameManager;
  private registry: Map<string, Minigame> = new Map();

  static getInstance(): MinigameManager { /* ... */ }

  register(minigame: Minigame): void { /* ... */ }
  launch(minigameId: string): boolean { /* ... */ }
  endActive(): void { /* ... */ }
  isUnlocked(minigameId: string): boolean { /* ... */ }
  getBestScore(minigameId: string): number { /* ... */ }
}
```

| Class | Display Name | Available From |
|---|---|---|
| `ObstacleRaceMinigame` | Carrera de Obstáculos | Start |
| `TreasureHuntMinigame` | Búsqueda del Tesoro | Start |
| `MathBasketballMinigame` | Baloncesto Matemático | Quest "Reto Deportivo" Q1 |
| `TypingRaceMinigame` | Torneo de Velocidad de Escritura | Quest "Misterio en la Biblioteca" Q1 |
| `PhysicsLabyrinthMinigame` | Laberinto de Física | DifficultyTier "Investigador" |
| `WordBuildingMinigame` | Construcción de Palabras | DifficultyTier "Maestro" |

`MathBasketballMinigame` generates arithmetic questions; only the ball labeled with the correct numeric result is accepted (Req 8.8). During any active minigame session, `HUD.setMinigameMode(true)` hides irrelevant elements (Req 8.7).

---

### SkillTree

```typescript
// src/gamification/SkillTree.ts

export type SkillBranch = 'explorador' | 'academico' | 'artesano';

export interface SkillEffect {
  type:
    | 'sprintSpeedMult' | 'jumpHeightMult'
    | 'xpPerfectMult' | 'revealAnswerCharge'
    | 'collectibleRadiusMult' | 'relicDetect'
    | 'coinPickupMult' | string;
  value: number;
}

export interface Skill {
  id: string;
  branch: SkillBranch;
  depth: number;           // 1-based
  displayName: string;
  description: string;
  effect: SkillEffect;
  prerequisiteIds: string[];
  cost: number;            // always 1 (Req 9.1)
}

export interface SkillTreeState {
  unlockedSkillIds: string[];
  availablePoints: number;
}

export class SkillTree {
  private static instance: SkillTree;

  static getInstance(): SkillTree { /* ... */ }

  canPurchase(skillId: string): boolean { /* ... */ }
  purchase(skillId: string): boolean { /* ... */ }
  getActiveEffects(): SkillEffect[] { /* ... */ }
  getEffectValue(type: string): number { /* ... */ }
  serialize(): SkillTreeState { /* ... */ }
  hydrate(state: SkillTreeState): void { /* ... */ }
}
```

18 skills across 3 branches (6 per branch, 3 depth levels × 2 skills each):

**Explorador**: `sprint_1` (+15% sprint), `jump_1` (+20% jump), `sprint_2` (+10% sprint), `jump_2` (double jump), `dash_1` (short dash), `stealth_1` (reduce NPC detection radius).

**Académico**: `xp_perfect_1` (2× XP on perfect completion), `reveal_1` (reveal correct answer once/puzzle), `timer_1` (+10s on quiz timers), `xp_streak_1` (streak XP bonus), `hint_1` (extra hint/session), `curriculum_1` (earn coins on perfect quiz answers).

**Artesano**: `collectible_radius_1` (+30% pickup radius), `relic_detect_1` (pulsing glow on nearby relics), `coin_pickup_1` (+20% coins from collectibles), `craft_1` (craft consumables in Shop), `shop_discount_1` (−10% Shop prices), `medal_1` (Silver medals count as Gold).

---

### Shop (Expanded)

```typescript
// src/gamification/Shop.ts

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
  availableFrom?: string;   // ISO date
  availableTo?: string;
  isSeasonalCollectible?: boolean;
}
```

20 items across 4 categories (5 per category). 3 seasonal collectibles (Halloween, Navidad, Primavera) with `availableFrom`/`availableTo` date windows (Req 10.8). Locked items show a coin deficit indicator (Req 10.3). On purchase, `ProgressionManager.buyItem()` is extended to handle `ExtendedShopItem`; equipped accessories call `AvatarModel.applyAccessory(itemId)` immediately without a reload (Req 10.5).

---

### AudioManager

```typescript
// src/audio/AudioManager.ts

export type AudioChannel = 'music' | 'sfx' | 'ambient';

export interface AudioSettings {
  musicVolume: number;    // 0–1
  sfxVolume: number;
  ambientVolume: number;
}

export type SfxId =
  | 'collectible_pickup' | 'quest_complete' | 'puzzle_correct' | 'puzzle_wrong'
  | 'npc_interact' | 'level_complete' | 'level_complete_3star' | 'player_jump'
  | 'achievement_unlock' | 'zone_unlock' | 'minigame_new_record'
  | 'shop_purchase' | 'skill_unlock';

export class AudioManager {
  private static instance: AudioManager;
  private context: AudioContext;
  private musicGain: GainNode;
  private sfxGain: GainNode;
  private ambientGain: GainNode;
  private currentMusicTrack: string | null = null;
  private settings: AudioSettings = { musicVolume: 0.7, sfxVolume: 0.8, ambientVolume: 0.5 };

  static getInstance(): AudioManager { /* ... */ }

  playMusic(trackId: string, crossfadeSecs?: number): void { /* default 2s */ }
  stopMusic(fadeOutSecs?: number): void { /* ... */ }
  playSfx(sfxId: SfxId): void { /* ... */ }
  playAmbient(trackId: string): void { /* ... */ }
  duckMusic(targetGain: number, durationSecs?: number): void { /* ... */ }
  unduckMusic(durationSecs?: number): void { /* ... */ }
  setVolume(channel: AudioChannel, value: number): void { /* 0 mutes without stopping */ }
  loadSettings(settings: AudioSettings): void { /* ... */ }
  serialize(): AudioSettings { /* ... */ }
}
```

Each `ZoneDefinition` carries a `musicTrackId` and `ambientSoundId`. On zone transition, `playMusic(zone.musicTrackId, 2)` cross-fades over 2 seconds (Req 11.1). Uses the Web Audio API `GainNode`; setting volume to 0 mutes without stopping playback state (Req 11.5). Settings restore from `SaveSystem` on next session start (Req 11.6).

---

### DayNightCycle

```typescript
// src/world/DayNightCycle.ts

export type DayPhase = 'morning' | 'afternoon' | 'evening' | 'night';

export interface DayNightSnapshot {
  elapsedSecs: number;
  currentPhase: DayPhase;
  normalizedTime: number;   // 0–1
}

export class DayNightCycle {
  private static instance: DayNightCycle;
  private elapsed = 0;
  private readonly cycleDuration = 1200;   // 20 real minutes

  static getInstance(): DayNightCycle { /* ... */ }

  update(delta: number): void { /* called from SceneManager update callback */ }
  getPhase(): DayPhase { /* ... */ }
  getNormalized(): number { /* (elapsed % cycleDuration) / cycleDuration */ }
  serialize(): DayNightSnapshot { /* ... */ }
  hydrate(snap: DayNightSnapshot): void { /* ... */ }
}
```

`SceneManager` gains `applyDayNightLighting(normalized: number, phase: DayPhase)`, which interpolates `AmbientLight` color/intensity and activates streetlamp `PointLight` instances at night (Req 12.2–12.3). Phase changes dispatch `EventBus.emit('daycycle:phaseChanged', ...)`.

---

### WeatherSystem

```typescript
// src/world/WeatherSystem.ts

export type WeatherState = 'clear' | 'cloudy' | 'rain';

export interface WeatherSnapshot {
  state: WeatherState;
  nextTransitionAt: number;  // game-time seconds
}

export class WeatherSystem {
  private static instance: WeatherSystem;
  private state: WeatherState = 'clear';
  private nextTransitionAt = 300;  // 5-min minimum
  private rainParticleSystem: THREE.Points | null = null;

  static getInstance(): WeatherSystem { /* ... */ }

  update(delta: number): void { /* ... */ }
  getCurrentWeather(): WeatherState { /* ... */ }
  serialize(): WeatherSnapshot { /* ... */ }
  hydrate(snap: WeatherSnapshot): void { /* ... */ }
}
```

Rain activates a `THREE.Points` particle system (1 000 droplets) and emits `EventBus.emit('weather:changed', { state: 'rain' })`. `PhysicsWorld` subscribes and applies `frictionMultiplier = 0.7` to ground colliders (Req 12.6). `WeatherSystem.getWeatherContext()` lets `DialogueSystem` inject weather-specific NPC dialogue lines (Req 12.7).

---

### SaveSystem

```typescript
// src/storage/SaveSystem.ts

export const SAVE_VERSION = 3;

export interface PlayerProfile {
  id: string;
  displayName: string;
  createdAt: number;
  lastPlayedAt: number;
  playtimeSeconds: number;
}

export interface GameSave {
  version: number;
  profile: PlayerProfile;
  progression: StudentProgress;
  campaign: CampaignProgress;
  narrative: NarrativeState;
  skillTree: SkillTreeState;
  questSystem: { activeQuestIds: string[]; completedQuestIds: string[]; dailyQuestDate: string };
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
  playtimeLabel: string;   // e.g. "3h 42m"
}

export class SaveSystem {
  private static instance: SaveSystem;
  private activeProfileId: string | null = null;

  static getInstance(): SaveSystem { /* ... */ }

  load(profileId: string): GameSave | null { /* migrates if needed */ }
  save(data: Partial<GameSave>): void { /* ... */ }
  autoSave(): void { /* debounced 500ms, triggered by EventBus */ }
  listProfiles(): ProfileSummary[] { /* ... */ }
  createProfile(displayName: string): PlayerProfile { /* ... */ }
  deleteProfile(profileId: string): boolean { /* ... */ }
  exportProfile(profileId: string): string { /* returns JSON, triggers download */ }

  private migrate(raw: unknown, fromVersion: number): GameSave { /* ... */ }
  private storageKey(profileId: string): string { /* 'kiro_save_v3_profile_1' */ }
}
```

`SaveSystem` subscribes to `EventBus` for `quest:completed`, `level:completed`, `puzzle:completed`, and `zone:entered`, debouncing auto-saves by 500ms (Req 13.1). `migrate()` handles `v1 → v3` and `v2 → v3` without data loss (Req 13.2). If `localStorage` is unavailable or `JSON.parse` throws, a fresh default save is returned without crashing (Req 13.3).

---

### AchievementSystem

```typescript
// src/gamification/AchievementSystem.ts

export interface AchievementCondition {
  type: 'count' | 'reach' | 'complete' | 'discover' | 'score';
  referenceId?: string;
  threshold: number;
  current?: number;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: 'exploration' | 'academic' | 'quest' | 'puzzle' | 'social' | 'historical' | 'hidden';
  condition: AchievementCondition;
  coinReward: number;   // 20–200
  earnedAt?: number;
}

export class AchievementSystem {
  private static instance: AchievementSystem;
  private achievements: Achievement[] = ACHIEVEMENT_DEFINITIONS;
  private unlockedIds: Set<string> = new Set();

  static getInstance(): AchievementSystem { /* ... */ }

  checkAll(): void { /* called after state changes */ }
  unlock(achievementId: string): void { /* awards coins, emits EventBus */ }
  getProgress(achievementId: string): number { /* 0–1 for progress bars */ }
  serialize(): string[] { /* ... */ }
  hydrate(ids: string[]): void { /* ... */ }
}
```

`ACHIEVEMENT_DEFINITIONS` contains 30+ entries (Req 14.1). The 6 HistoricalFigure hidden achievements (Req 14.8) are checked by listening for `puzzle:completed` events grouped by figure ID prefix.

---

### Leaderboard

```typescript
// src/gamification/Leaderboard.ts

export interface LeaderboardEntry {
  playerName: string;
  profileId: string;
  score: number;
  timestamp: number;
}

export interface LeaderboardData {
  byMinigame: Record<string, LeaderboardEntry[]>;  // max 10 per key, sorted desc
}

export class Leaderboard {
  private static instance: Leaderboard;
  private data: LeaderboardData = { byMinigame: {} };

  static getInstance(): Leaderboard { /* ... */ }

  /** Returns true if the entry made the top 10. */
  submitScore(minigameId: string, score: number, playerName: string, profileId: string): boolean { /* ... */ }
  getTop10(minigameId: string): LeaderboardEntry[] { /* ... */ }
  serialize(): LeaderboardData { /* ... */ }
  hydrate(data: LeaderboardData): void { /* ... */ }
}
```

---

## Data Models

### Zone Definitions (8 Zones)

```typescript
export const ZONE_DEFINITIONS: ZoneDefinition[] = [
  {
    id: 'patio_central',
    displayName: 'Patio Central',
    description: 'El corazón del IES, donde todo comienza.',
    ambientColor: 0xffe4b5, fogColor: 0x93c5fd, fogNear: 30, fogFar: 85,
    spawnPoint: new THREE.Vector3(0, 0, 0),
    adjacentZones: ['biblioteca', 'pista_deportiva', 'huerto_escolar'],
    pointsOfInterest: [ /* NPCs: don_manuel, dona_carmen, paco_conserje + 5 POIs */ ],
    ambientSoundId: 'ambient_outdoor', musicTrackId: 'music_patio',
  },
  {
    id: 'biblioteca',
    displayName: 'Biblioteca',
    description: 'Hogar del conocimiento y los enigmas literarios.',
    ambientColor: 0xfff8dc, fogColor: 0x8b7355, fogNear: 20, fogFar: 60,
    adjacentZones: ['patio_central', 'pasillo_historia'],
    musicTrackId: 'music_biblioteca',
    ambientSoundId: 'ambient_library',
    // ...
  },
  // ... 6 more zones
  {
    id: 'tejado_secreto',
    displayName: 'Tejado Secreto',
    description: 'Solo los exploradores más valientes llegan aquí.',
    unlockCondition: {
      type: 'quest', referenceId: 'main_quest_10',
      displayHint: 'Completa el décimo capítulo del Gran Certamen para subir al tejado.',
    },
    adjacentZones: ['pasillo_historia'],
    musicTrackId: 'music_tejado',
    ambientSoundId: 'ambient_rooftop',
    // ...
  },
];
```

### Quest Chains

- **Main chain**: "El Gran Certamen del IES" — 12 quests, one per zone (some zones have 2).
- **Secondary chain A**: "Misterio en la Biblioteca" — 5 quests.
- **Secondary chain B**: "Reto Deportivo" — 5 quests.

### Skill Definitions (abbreviated sample)

```typescript
export const SKILL_DEFINITIONS: Skill[] = [
  { id: 'sprint_1', branch: 'explorador', depth: 1, displayName: 'Corredor Veloz',
    description: '+15% velocidad de sprint.', effect: { type: 'sprintSpeedMult', value: 1.15 },
    prerequisiteIds: [], cost: 1 },
  { id: 'jump_1', branch: 'explorador', depth: 1, displayName: 'Salto Mejorado',
    description: '+20% altura de salto.', effect: { type: 'jumpHeightMult', value: 1.20 },
    prerequisiteIds: [], cost: 1 },
  { id: 'xp_perfect_1', branch: 'academico', depth: 1, displayName: 'Estudioso Perfecto',
    description: '2× XP en completaciones perfectas de Puzzle.',
    effect: { type: 'xpPerfectMult', value: 2.0 }, prerequisiteIds: [], cost: 1 },
  { id: 'reveal_1', branch: 'academico', depth: 1, displayName: 'Truco del Profe',
    description: 'Revela la respuesta correcta una vez por sesión de Puzzle.',
    effect: { type: 'revealAnswerCharge', value: 1 }, prerequisiteIds: [], cost: 1 },
  // ...14 more
];
```

---

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Caesar Cipher Round-Trip

*For any* string of alphabetic characters and any integer shift value in [1, 26], encoding the string with `caesar(text, shift)` and then decoding it with `caesar(encoded, -shift)` SHALL produce a string equal to the original.

**Validates: Requirements 4.9**

---

### Property 2: SaveSystem Migration Preserves Fields

*For any* valid save object conforming to an earlier schema version (v1 or v2), migrating it to v3 SHALL produce a `GameSave` object where every field present in the source object retains an equivalent value, and no field is `undefined`.

**Validates: Requirements 13.2**

---

### Property 3: SaveSystem Resilience to Corrupt Input

*For any* string (empty, non-JSON, or partial JSON), calling `SaveSystem.load()` when `localStorage` returns that string SHALL return a valid default `GameSave` without throwing an exception.

**Validates: Requirements 13.3**

---

### Property 4: AdaptiveDifficulty Success Rate Invariant

*For any* sequence of up to 10 boolean interaction records, `AdaptiveDifficulty.getSuccessRate()` SHALL return a value in the closed interval [0, 1] equal to `trueCount / Math.max(1, records.length)`.

**Validates: Requirements 5.3, 5.4, 5.5**

---

### Property 5: NPC Relationship Score Clamping

*For any* NPC id and any sequence of integer delta values passed to `DialogueSystem.modifyRelationship()`, the stored relationship score for that NPC SHALL always remain within the closed interval [−100, +100].

**Validates: Requirements 3.6**

---

### Property 6: SkillTree Prerequisite Invariant

*For any* sequence of `SkillTree.purchase()` calls, the resulting set of unlocked skills SHALL satisfy: for every skill at depth N ≥ 2, there exists at least one unlocked skill at depth N−1 in the same branch.

**Validates: Requirements 9.4**

---

### Property 7: Shop Purchase Coin Invariant

*For any* player with coin balance C and any shop item with price P, if C ≥ P then after a successful purchase the coin balance SHALL equal C − P; if C < P the purchase SHALL be rejected and the coin balance SHALL remain unchanged.

**Validates: Requirements 10.2**

---

### Property 8: Leaderboard Top-10 Ordering and Size

*For any* sequence of score submissions to a single minigame, the resulting leaderboard SHALL contain at most 10 entries, SHALL be sorted in descending order by score, and the entry set SHALL equal the top-10 scores from all submitted entries (regardless of submission order).

**Validates: Requirements 14.5**

---

### Property 9: DayNight Cycle Phase Normalization

*For any* non-negative elapsed time T in seconds, the normalized cycle position `(T % cycleDuration) / cycleDuration` SHALL be in the half-open interval [0, 1).

**Validates: Requirements 12.1**

---

### Property 10: NarrativeState Serialization Round-Trip

*For any* valid `NarrativeState` object, serializing it to JSON and deserializing it SHALL produce an object with equivalent `completedQuestIds`, `activeQuestIds`, `dialogueChoices`, `relationships`, and `discoveredSecrets` values.

**Validates: Requirements 2.3**

---

### Property 11: Locked Zone Message Non-Empty

*For any* `ZoneDefinition` with a non-null `unlockCondition`, calling `ZoneManager.getUnlockMessage(zoneId)` SHALL return a non-empty string.

**Validates: Requirements 1.7**

---

## Error Handling

| Scenario | Handling |
|---|---|
| `localStorage` unavailable or quota exceeded | `SaveSystem` logs warning, uses in-memory default state, does not crash |
| `localStorage` returns corrupt JSON | `JSON.parse` in try/catch; `SaveSystem.load()` falls back to `createDefaultSave()` |
| Zone asset load failure | `ZoneManager.transitionTo()` rejects, stays in current zone, shows error toast |
| `AudioContext` suspended (browser autoplay policy) | `AudioManager` defers play until first user gesture via `AudioContext.resume()` |
| Dialogue tree references missing node ID | `DialogueSystem` logs warning and closes the dialogue gracefully |
| Quest objective references a deleted NPC | `QuestSystem` marks objective as skipped; does not block quest completion |
| `SkillTree.hydrate()` receives unknown skill IDs | Unknown IDs are filtered out silently; valid skills are applied |
| `DailyChallenge` generation when `CurriculumService` returns empty | Falls back to a hardcoded "find 3 collectibles" exploration objective |
| Leaderboard top-10 full and new score ties 10th | New entry replaces old only when score is strictly greater |
| `WeatherSystem` next transition fires while minigame is active | Weather state updates but particle system activation is deferred until minigame ends |

---

## Testing Strategy

### Overview

The project uses **Vitest** (present via `vite.config.ts`). Property-based testing uses **[fast-check](https://github.com/dubzzz/fast-check)** (MIT, actively maintained, first-class TypeScript support), installed as a dev dependency: `npm install --save-dev fast-check`.

Testing uses a dual approach:

- **Property-based tests (PBT)**: validate universal invariants across many generated inputs, minimum 100 iterations each.
- **Unit / example tests**: validate specific behaviors, edge cases, and integration points.

Both are complementary. Property tests catch whole classes of edge cases; unit tests pin concrete expected values.

### Property-Based Tests

Each property maps to one `fc.assert(fc.property(...))` block. Tag format (in a comment above each test):
`// Feature: complete-game-expansion, Property N: <title>`

| Property | Generator sketch |
|---|---|
| P1 Caesar round-trip | `fc.string()` filtered to uppercase alpha × `fc.integer({min:1, max:26})` |
| P2 Migration preserves fields | `fc.record(...)` matching v1/v2 schemas with optional fields |
| P3 Corrupt input resilience | `fc.string()` (any string including empty) |
| P4 Success rate invariant | `fc.array(fc.boolean(), { maxLength: 10 })` |
| P5 Relationship clamping | `fc.string()` (npcId) × `fc.array(fc.integer({ min:-200, max:200 }))` |
| P6 SkillTree prerequisite | `fc.array(fc.constantFrom(...skillIds))` |
| P7 Shop coin invariant | `fc.nat()` (balance) × random `ExtendedShopItem` |
| P8 Leaderboard ordering | `fc.array(fc.record({ score: fc.nat(), name: fc.string() }), { maxLength: 50 })` |
| P9 DayNight normalization | `fc.float({ min: 0, max: 72000, noNaN: true })` |
| P10 NarrativeState round-trip | `fc.record(...)` matching `NarrativeState` shape |
| P11 Zone unlock message | `fc.constantFrom(...lockedZoneIds)` |

### Unit / Example Tests

- **DialogueSystem**: typewriter fires at 40 chars/s; `isDialogueActive()` blocks movement; choice selection records in `NarrativeState`.
- **QuestSystem**: `acceptQuest()` adds to active list; prerequisite check hides SideQuests; `generateDailyChallenge()` uses today's date key; all objectives complete → mark done.
- **ZoneManager**: `transitionTo()` returns `false` for locked zones; emits `zone:entered` event on success; title card shows for 3 seconds.
- **AudioManager**: `duckMusic(0.4)` sets `GainNode.gain.value` to 0.4; `setVolume('music', 0)` does not stop the source node.
- **SkillTree**: purchase fails when `availablePoints === 0`; effects stack correctly; `serialize`/`hydrate` round-trips.
- **AchievementSystem**: unlocking fires `EventBus 'achievement:unlocked'`; `getProgress()` returns 0 before any progress; coin bonus is applied.
- **MinigameManager**: `launch()` returns `false` for locked minigames; new personal best awards 25 bonus coins.
- **LevelManager extension**: replayed level randomises ≥30% of collectible positions; `HybridChallenge` gate stays locked until quiz answer is correct.
- **HybridChallenge scoring**: wrong answer deducts 20 XP from potential without closing session; 30 seconds over par deducts 10% of score.
- **WeatherSystem**: friction multiplier is 0.7 during rain; particle system is toggled on/off with weather state transitions.
- **AdaptiveDifficulty thresholds**: 3/10 correct → `hintsEnabled === true`, timer reduced 20%; 9/10 correct → `xpMultiplier === 0.7`.
- **SaveSystem profiles**: `listProfiles()` returns max 3 entries; `deleteProfile()` requires confirmation and removes the localStorage key; `exportProfile()` returns valid JSON.
