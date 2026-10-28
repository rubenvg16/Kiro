# Implementation Plan — Complete Game Expansion

## Phase 0: Testing Harness & Tooling Foundation
- [x] 0. Testing Harness Setup
  - Install `vitest` and `fast-check` as dev dependencies.
  - Update `vite.config.ts` to configure the Vitest test runner.
  - Add `"test": "vitest run"` and `"test:watch": "vitest"` to `package.json` scripts.
  - Create `src/__tests__/setup.ts` with browser API mocks (localStorage, AudioContext, ResizeObserver).
  - Files: `package.json`, `vite.config.ts`, `src/__tests__/setup.ts`
  - _Requirements: Foundations for all requirements_

## Phase 1: Core Substrate & Persistence
- [x] 1. EventBus — Typed event bus core infrastructure
  - Create `src/core/EventBus.ts` as a typed singleton event bus with the full `EventMap` from the design document (`quest:completed`, `puzzle:completed`, `zone:entered`, `achievement:unlocked`, `weather:changed`, `daycycle:phaseChanged`, `npc:relationshipChanged`, and all gameplay events). Implement `on()`, `emit()`, and `off()` methods.
  - Create unit tests verifying typed subscriptions, multi-handler dispatch, and clean unsubscription.
  - Files: `src/core/EventBus.ts`, `src/__tests__/core/EventBus.test.ts`
  - _Requirements: R1, R2, R3, R4, R5, R6, R7, R8, R9, R10, R11, R12, R13, R14, R15_

- [x] 2. SaveSystem — Multi-profile versioned persistence
  - Create `src/storage/SaveSystem.ts` implementing `GameSave` interface (v3 schema), profile management (max 3), `load()` with migration from v1/v2, `save()`, `autoSave()` triggered by EventBus (debounced 500ms), and `exportProfile()` triggering JSON download. Handle localStorage unavailability or parse errors gracefully with a fresh default save and warning log.
  - Implement Property Test P2 (v1/v2 to v3 schema migration field preservation) and Property Test P3 (corrupt input resilience without throwing).
  - Files: `src/storage/SaveSystem.ts`, `src/__tests__/properties/save.property.test.ts`
  - _Requirements: R13_

  - [x] 2.1. Profile selection screen
    - Create the profile selection HTML/CSS overlay rendered by `SaveSystem` before entering the WorldMap. Display up to 3 profile summary cards (name, rank, totalXP, quests completed, playtime as "Xh Ym"). Include "New Profile" (blocked when 3 exist), "Delete" with confirmation UIModal, and profile select button.
    - Files: `src/storage/ProfileSelectScreen.ts`, `src/style.css`
    - _Requirements: R13_

- [x] 3. Game Bootstrap & Lifecycle Orchestration
  - Create `src/core/GameBootstrap.ts` to orchestrate deterministic system startup order: EventBus → SaveSystem (profile hydration) → AudioManager → SceneManager/Physics → ZoneManager → World UI.
  - Update `src/main.ts` to delegate initialization to `GameBootstrap` with graceful error handling and asset loading progress feedback.
  - Files: `src/core/GameBootstrap.ts`, `src/main.ts`
  - _Requirements: R13, R15_

## Phase 2: World, Environment & Audio
- [x] 4. AudioManager — Dynamic zone music and SFX
  - Create `src/audio/AudioManager.ts` using Web Audio API (`AudioContext`, `GainNode`). Implement `playMusic(trackId, crossfadeSecs=2)`, `playSfx(sfxId)`, `playAmbient(trackId)`, `duckMusic(targetGain, durationSecs)`, `unduckMusic()`, `setVolume(channel, 0-1)`, `loadSettings()`, and `serialize()`. Support 13 SFX IDs. Volume 0 mutes without stopping playback state. Persist volume settings via SaveSystem.
  - Add unit tests for volume clamping, channel separation, and music ducking calculations.
  - Files: `src/audio/AudioManager.ts`, `src/__tests__/audio/AudioManager.test.ts`
  - _Requirements: R11_

- [x] 5. ZoneManager — 8-zone open world with seamless transitions
  - Create `src/world/ZoneManager.ts` with all 8 `ZoneDefinition` objects (Patio Central, Biblioteca, Laboratorio, Pista Deportiva, Huerto Escolar, Sala de Informática, Pasillo de Historia, Tejado Secreto). Implement `transitionTo(zoneId)` completing within 2 seconds without a blocking screen. Apply zone lighting via `SceneManager.applyZoneEnvironment()`. Cross-fade audio via `AudioManager`. Show Zone title card for 3 seconds on first entry. Track explored zones. Enforce unlock conditions with explanatory messages.
  - Implement Property Test P11 (locked zone non-empty unlock message).
  - Files: `src/world/ZoneManager.ts`, `src/world/ZoneDefinitions.ts`, `src/core/SceneManager.ts` (extend), `src/__tests__/properties/zone.property.test.ts`
  - _Requirements: R1_

- [x] 6. DayNightCycle and WeatherSystem
  - Create `src/world/DayNightCycle.ts`: 20-minute full cycle (morning/afternoon/evening/night), `update(delta)` called from render loop, phase change dispatches `daycycle:phaseChanged` event, serialize/hydrate. Extend `SceneManager` with `applyDayNightLighting(normalized, phase)`.
  - Create `src/world/WeatherSystem.ts`: 3 states (Clear/Cloudy/Rain), transition interval min 5min max 30min. Rain: THREE.Points particle system (1000 droplets within 30 world units of player). Cloudy: ambient light at 60%, no directional shadows. Rain emits `weather:changed` and PhysicsWorld subscribes to apply friction 0.7.
  - Implement Property Test P9 (day/night normalized cycle invariant in [0, 1)).
  - Files: `src/world/DayNightCycle.ts`, `src/world/WeatherSystem.ts`, `src/core/SceneManager.ts` (extend), `src/core/physics/PhysicsWorld.ts` (extend), `src/__tests__/properties/daynightcycle.property.test.ts`
  - _Requirements: R12_

## Phase 3: Narrative & Quest System
- [x] 7. DialogueSystem and NarrativeState
  - Create `src/world/DialogueSystem.ts` implementing `DialogueTree`, `DialogueNode`, `DialogueChoice`, and `DialogueLine` interfaces. Typewriter at 40 chars/second with skip-to-end on advance input. While dialogue active: disable PlayerController movement, duck AudioManager music by 60%, pause NPC animations. Track `RelationshipScore` per NPC clamped to [-100, +100].
  - Implement Property Test P5 (relationship score clamping) and Property Test P10 (NarrativeState round-trip serialization).
  - Files: `src/world/DialogueSystem.ts`, `src/world/NPCDialogueData.ts`, `src/world/NPCManager.ts` (extend with 15 NPCs + backstories), `src/__tests__/properties/npc.property.test.ts`, `src/__tests__/properties/narrative.property.test.ts`
  - _Requirements: R3_

  - [x] 7.1. HistoricalFigures dialogue extension
    - Extend `src/world/HistoricalFiguresManager.ts` to support 6 HistoricalFigures, each with ≥4 unique dialogue lines and one unique Puzzle ID not shared with any other figure. Wire into DialogueSystem.
    - Files: `src/world/HistoricalFiguresManager.ts`
    - _Requirements: R3_

- [x] 8. QuestSystem — 4 quest types and 3 narrative chains
  - Create `src/quests/QuestSystem.ts` implementing state machine: Hidden → Available → Active → Completed (plus Expired for DailyChallenges). Support sequential and parallel objective modes. Guard locked sequential objectives. Grant XP/coins immediately, update NarrativeState, trigger NPC reaction, and dispatch `quest:completed`. Place objective markers. Generate DailyChallenge from CurriculumService at 00:00 local time.
  - Create `src/quests/QuestDefinitions.ts` with the main chain "El Gran Certamen del IES" (12 quests across all 8 zones), secondary chain "Misterio en la Biblioteca" (5 quests), secondary chain "Reto Deportivo" (5 quests).
  - Files: `src/quests/QuestSystem.ts`, `src/quests/QuestDefinitions.ts`, `src/quests/QuestJournalModal.ts`, `src/__tests__/quests/QuestSystem.test.ts`
  - _Requirements: R2, R6_

  - [x] 8.1. Quest Journal UIModal
    - Create `src/quests/QuestJournalModal.ts` rendering the Quest Journal overlay. Show Active quests as numbered checklists with filled checkboxes, highlighted current objective, and XP reward. Show Completed quests list. Accessible from HUD at all times.
    - Files: `src/quests/QuestJournalModal.ts`
    - _Requirements: R6_

## Phase 4: Puzzles, Adaptive Difficulty & Minigames
- [x] 9. PuzzleEngine — HybridChallenge extensions
  - Create `src/puzzles/types.ts` with `PuzzlePhase`, `MechanicalPhaseContent`, `QuizPhaseContent`, `HybridChallenge`, `PuzzleSession`, and `PuzzleDifficulty` interfaces. Extend `src/puzzles/PuzzleEngine.ts` with `launchHybridChallenge()`, `setDifficulty()`, `getBestScore()`, and `awardGoldMedal()`. Enforce alternating phase structure (mechanical → quiz × 2 minimum). Score penalty: -10% per 30s over par. Wrong answer: explanation + deduct 20 XP from potential (floor 0). Gold medal on perfect run.
  - Implement Property Test P1 (Caesar cipher encode/decode round-trip property).
  - Files: `src/puzzles/types.ts`, `src/puzzles/PuzzleEngine.ts` (extend), `src/puzzles/HybridChallengeDefinitions.ts`, `src/__tests__/properties/cipher.property.test.ts`
  - _Requirements: R4_

- [x] 10. AdaptiveDifficulty
  - Create `src/puzzles/AdaptiveDifficulty.ts` tracking last 10 HybridChallenge interactions (correct/incorrect) stored in SaveSystem. If success rate <40%: `shouldShowHint() = true`, `getAdjustedTimer()` returns base × 0.8. If success rate >85%: `getXpMultiplier()` returns 0.7, surface harder questions from next DifficultyTier pool.
  - Implement Property Test P4 (success rate calculation invariant).
  - Files: `src/puzzles/AdaptiveDifficulty.ts`, `src/puzzles/PuzzleEngine.ts` (extend), `src/__tests__/properties/adaptive.property.test.ts`
  - _Requirements: R5_

- [x] 11. MinigameManager and 6 Minigames
  - Create `src/minigames/MinigameManager.ts` implementing Strategy pattern with `Minigame` interface. On launch: rules screen. On end: result screen (score, time, comparison to personal best, 50 XP). Persist best score per minigame in SaveSystem. New record animation and 25 coins bonus.
  - Create 6 minigame classes: `ObstacleRaceMinigame`, `TreasureHuntMinigame`, `MathBasketballMinigame`, `TypingRaceMinigame`, `PhysicsLabyrinthMinigame`, and `WordBuildingMinigame`.
  - Files: `src/minigames/MinigameManager.ts`, `src/minigames/Minigame.ts`, `src/minigames/ObstacleRaceMinigame.ts`, `src/minigames/TreasureHuntMinigame.ts`, `src/minigames/MathBasketballMinigame.ts`, `src/minigames/TypingRaceMinigame.ts`, `src/minigames/PhysicsLabyrinthMinigame.ts`, `src/minigames/WordBuildingMinigame.ts`, `src/__tests__/minigames/MinigameManager.test.ts`
  - _Requirements: R8_

## Phase 5: Progression, Economy & Systems
- [x] 12. SkillTree — 18 skills across 3 branches
  - Create `src/gamification/SkillTree.ts` with `Skill`, `SkillEffect`, and `SkillTreeState` interfaces and 18 `SKILL_DEFINITIONS` (6 per branch × 3 depth levels). Enforce prerequisite DAG: depth-N skill requires ≥1 unlocked skill at depth N-1 in same branch. `purchase(skillId)`: deduct 1 Skill Point, apply effect immediately.
  - Implement Property Test P6 (SkillTree prerequisite DAG validation).
  - Files: `src/gamification/SkillTree.ts`, `src/gamification/SkillDefinitions.ts`, `src/gamification/SkillTreeModal.ts`, `src/__tests__/properties/skilltree.property.test.ts`
  - _Requirements: R9_

- [x] 13. Shop Expansion — 20 items across 4 categories
  - Extend Shop (via ProgressionManager) to offer ≥20 items across 4 categories (Accesorios de Avatar, Mejoras de Mochila, Decoraciones de Zona, Consumibles de Puzzle). Atomic purchase: deduct coins + add to inventory + persist (rollback on failure). Coin deficit indicator for unaffordable items. Equip Avatar accessory: call `AvatarModel.applyAccessory(itemId)` without reload.
  - Implement Property Test P7 (shop coin balance non-negative invariant).
  - Files: `src/gamification/Shop.ts`, `src/gamification/ShopItems.ts`, `src/gamification/ProgressionManager.ts` (extend), `src/avatar/AvatarModel.ts` (extend), `src/__tests__/properties/shop.property.test.ts`
  - _Requirements: R10_

- [x] 14. AchievementSystem and Leaderboard
  - Create `src/gamification/AchievementSystem.ts` with ≥30 `ACHIEVEMENT_DEFINITIONS` across 6 categories. Subscribe to EventBus events to check progress after state changes. On unlock: 3-second toast, award coins (20-200), persist in SaveSystem. Hidden achievements for 6 HistoricalFigures.
  - Create `src/gamification/Leaderboard.ts` storing top-10 scores per minigame.
  - Implement Property Test P8 (leaderboard top-10 ordering and size invariant).
  - Files: `src/gamification/AchievementSystem.ts`, `src/gamification/AchievementDefinitions.ts`, `src/gamification/AchievementsModal.ts`, `src/gamification/Leaderboard.ts`, `src/gamification/LeaderboardModal.ts`, `src/__tests__/properties/leaderboard.property.test.ts`
  - _Requirements: R14_

## Phase 6: Polish, Campaign Expansion & Final Quality Gates
- [x] 15. LevelManager and LevelBuilder Extensions — 15 Levels
  - Extend `src/levels/LevelManager.ts`: support 15 campaign levels (5 per DifficultyTier). Auto-unlock tiers. On 3-star completion: unlock challenge variant with par time -20% and ≥2 extra obstacles. Record Level Badge. Level preview screen.
  - Extend `src/levels/LevelBuilder.ts`: unique mechanics per level (timed platforming, gravity inversion, magnetic blocks, fog of war, mirror rooms, ice surfaces, wind gusts). Support HybridChallenge gates. Emissive Three.js materials. Randomize ≥30% collectible positions on replay.
  - Files: `src/levels/LevelManager.ts` (extend), `src/levels/LevelBuilder.ts` (extend), `src/levels/LevelDefinitions.ts`, `src/levels/levels/` (10 new level files)
  - _Requirements: R7_

- [x] 16. HUD Extensions, Visual Polish & Vignette
  - Extend HUD with: minimap overlay with explored zones; DifficultyTier badge; Skill Points counter; Day/Night phase icon. Red pulsing vignette effect on screen-edge when timed challenge has <10 seconds remaining. Loading progress bar (0-100%) during transitions. Animated UIModals (200ms scale-up). Pause modal on Escape key. Collectible particle burst effect.
  - Files: `src/world/HUD.ts` (extend), `src/world/VignetteEffect.ts`, `src/avatar/AvatarModel.ts` (extend), `src/style.css`
  - _Requirements: R1, R5, R9, R15_

---

## Dependency Graph

```
Phase 0: T0 (Testing Setup)
   │
Phase 1: ├── T1 (EventBus + Unit Tests)
         ├── T2 (SaveSystem + Migration PBT)
         └── T3 (GameBootstrap Lifecycle Wiring)
   │
Phase 2: ├── T4 (AudioManager)
         ├── T5 (ZoneManager + PBT)
         └── T6 (DayNightCycle & Weather + PBT)
   │
Phase 3: ├── T7 (DialogueSystem + PBT)
         └── T8 (QuestSystem + Journal)
   │
Phase 4: ├── T9 (PuzzleEngine HybridChallenge + PBT)
         ├── T10 (AdaptiveDifficulty + PBT)
         └── T11 (MinigameManager + 6 Minigames)
   │
Phase 5: ├── T12 (SkillTree + PBT)
         ├── T13 (Shop Expansion + PBT)
         └── T14 (AchievementSystem + Leaderboard + PBT)
   │
Phase 6: ├── T15 (15 Campaign Levels)
         └── T16 (HUD, Vignette & Visual Polish)
```
