# Requirements Document

## Introduction

Este documento describe la expansión masiva del videojuego educativo existente (TypeScript + Three.js + Vite) para convertirlo en un videojuego completo, entretenido y narrativamente rico. El proyecto ya cuenta con un motor de física, sistema de niveles, NPCs, personajes históricos, progresión del jugador, puzzles y currículo escolar español. La expansión añade un mundo abierto interconectado por zonas, una narrativa central con arco dramático, un sistema de misiones (quests) con historias ramificadas, nuevos puzzles híbridos (mecánica + pregunta), un sistema de dificultad progresiva, minijuegos satisfactorios, economía ampliada y todas las capas de pulido necesarias para que el resultado sea un videojuego real y memorable.

## Glossary

- **Game**: El videojuego educativo completo resultado de la expansión.
- **Player**: El estudiante que controla el avatar en el mundo 3D.
- **Avatar**: Representación 3D personalizable del Player.
- **Zone**: Área geográfica claramente delimitada del mundo abierto.
- **WorldMap**: Mapa navegable compuesto por todas las Zones interconectadas.
- **NPC**: Personaje No Jugable que habita el mundo y puede dar diálogos, misiones y recompensas.
- **HistoricalFigure**: Subtipo especial de NPC que representa a una figura histórica real con puzzle propio.
- **Quest**: Misión con objetivos secuenciales, recompensas y ramificaciones narrativas.
- **QuestChain**: Secuencia ordenada de Quests que conforman un arco narrativo completo.
- **QuestSystem**: Sistema que gestiona el ciclo de vida de todas las Quests.
- **Puzzle**: Actividad interactiva que combina mecánica de juego con contenido educativo.
- **PuzzleEngine**: Sistema singleton que gestiona el ciclo de vida de todos los Puzzles.
- **HybridChallenge**: Puzzle que alterna fases mecánicas con preguntas de quiz.
- **DifficultyTier**: Nivel de dificultad global del juego (Explorador / Investigador / Maestro).
- **AdaptiveDifficulty**: Ajuste automático de parámetros basado en el rendimiento del Player.
- **ProgressionManager**: Sistema singleton que gestiona XP, monedas, rango y desbloqueos del Player.
- **CampaignProgress**: Registro de niveles completados, estrellas y mejores tiempos.
- **Collectible**: Objeto recogible que otorga XP o monedas al Player.
- **Relic**: Coleccionable especial oculto que otorga una recompensa única e irrepetible.
- **Shop**: Tienda in-game donde el Player gasta monedas para desbloquear accesorios y mejoras.
- **SkillTree**: Árbol de habilidades pasivas y activas desbloqueables por el Player.
- **Skill**: Habilidad individual dentro del SkillTree.
- **DialogueSystem**: Sistema de diálogos con opciones, condiciones y estados.
- **NarrativeState**: Objeto persistente que registra decisiones narrativas y relaciones con NPCs.
- **CurriculumService**: Servicio que provee preguntas y retos del currículo escolar español.
- **LevelBuilder**: Clase constructora de geometría y colisionadores de un nivel de campaña.
- **LevelManager**: Gestor de la campaña de niveles: carga, descarga, progreso y recompensas.
- **SceneManager**: Clase que gestiona la escena Three.js, cámara y ciclo de render.
- **PhysicsWorld**: Motor de física que gestiona colisiones y cuerpos dinámicos.
- **MinigameManager**: Sistema que registra y lanza los minijuegos disponibles.
- **Minigame**: Actividad corta y autocontenida con mecánica diferente al gameplay base.
- **DayNightCycle**: Sistema que simula el paso del tiempo visual dentro del juego.
- **AudioManager**: Sistema que gestiona música ambiental, efectos de sonido y narración.
- **SaveSystem**: Sistema que persiste el estado completo del juego en localStorage con versionado.
- **HUD**: Interfaz de usuario superpuesta al canvas con información de estado.
- **UIModal**: Ventana emergente bloqueante que muestra contenido específico.

---

## Requirements

### Requirement 1: Mundo Abierto Interconectado por Zonas

**User Story:** As a Player, I want to explore a large interconnected open world divided into distinct zones, so that I feel the sensation of discovery and adventure across a real game world.

#### Acceptance Criteria

1. THE WorldMap SHALL contain at least 8 distinct Zones: Patio Central, Biblioteca, Laboratorio de Ciencias, Pista Deportiva, Huerto Escolar, Sala de Informática, Pasillo de Historia and Tejado Secreto.
2. WHEN the Player walks to a Zone boundary, THE Game SHALL seamlessly load the adjacent Zone without a blocking loading screen.
3. THE Game SHALL display a minimap overlay on the HUD that shows explored Zones and the Player's current position.
4. WHEN the Player first enters a new Zone, THE Game SHALL display a Zone title card with the Zone's name and a brief description for 3 seconds.
5. WHILE the Player is in a Zone, THE SceneManager SHALL apply a unique ambient lighting color and fog density specific to that Zone.
6. THE WorldMap SHALL contain at least 25 interactive points of interest distributed across all Zones.
7. IF the Player attempts to enter a locked Zone, THEN THE Game SHALL display a message explaining the unlock condition.
8. WHEN the Player unlocks a previously locked Zone, THE Game SHALL play an unlock sound and display a toast notification identifying the newly accessible Zone.

---

### Requirement 2: Sistema de Narrativa Central y Arcos Narrativos

**User Story:** As a Player, I want the game to have a central story with memorable characters and a dramatic arc, so that I feel motivated to keep playing to discover what happens next.

#### Acceptance Criteria

1. THE Game SHALL implement a main QuestChain titled "El Gran Certamen del IES" composed of at least 12 sequential Quests spanning the full WorldMap.
2. WHEN the Player starts the game for the first time, THE DialogueSystem SHALL launch an introductory sequence where the director NPC explains the story premise in at least 5 dialogue lines.
3. THE Game SHALL maintain a persistent NarrativeState object that records the Player's dialogue choices, QuestChain progress, and NPC relationship scores.
4. WHEN the Player completes the final Quest of the main QuestChain, THE Game SHALL display an ending sequence of at least 3 screens summarising the Player's journey and final statistics.
5. THE Game SHALL implement at least 2 secondary QuestChains with independent narratives, each containing at least 5 Quests.
6. WHEN a Quest is completed, THE Game SHALL show a Quest completion animation and a summary screen listing objectives achieved, XP earned and coins earned.
7. THE Game SHALL expose a Quest Journal UIModal accessible from the HUD at any time, showing active Quests, completed Quests and next objectives.
8. IF a Quest has branching dialogue options, THEN THE DialogueSystem SHALL record the chosen option in NarrativeState and adjust subsequent NPC dialogue accordingly.

---

### Requirement 3: NPCs con Historia Propia y Diálogos Ricos

**User Story:** As a Player, I want NPCs to have their own backstory, personality, and rich multi-turn dialogue, so that I feel the world is alive and worth talking to everyone in it.

#### Acceptance Criteria

1. THE Game SHALL feature at least 15 distinct NPCs each with a unique name, role, personality description, backstory paragraph and portrait icon.
2. THE DialogueSystem SHALL support multi-turn conversation trees with at least 3 selectable Player responses per NPC interaction.
3. WHEN the Player selects a dialogue option that unlocks a Quest, THE DialogueSystem SHALL transition to the Quest acceptance screen.
4. THE DialogueSystem SHALL display NPC dialogue text with a typewriter animation at 40 characters per second.
5. WHILE a dialogue is active, THE Game SHALL pause all NPC animations and disable Player movement.
6. THE DialogueSystem SHALL track a Relationship Score (range −100 to +100) per NPC and adjust dialogue trees based on the current score.
7. WHEN the Player revisits an NPC after completing their associated Quest, THE DialogueSystem SHALL offer different dialogue lines acknowledging the Player's achievement.
8. THE Game SHALL include at least 6 HistoricalFigures each with at least 4 dialogue lines and a unique associated Puzzle.
9. IF the Player speaks to an NPC with no new Quest or dialogue content, THEN THE DialogueSystem SHALL cycle through at least 3 idle dialogue lines without immediate repetition.

---

### Requirement 4: Puzzles Híbridos (Mecánica + Educativo)

**User Story:** As a Player, I want puzzles that mix fun game mechanics with educational questions, so that learning feels like part of the adventure rather than a separate test.

#### Acceptance Criteria

1. THE PuzzleEngine SHALL implement at least 12 distinct Puzzles covering Matemáticas, Lengua, Ciencias, Historia and Tecnología.
2. WHEN a HybridChallenge is launched, THE PuzzleEngine SHALL alternate at least 2 mechanical phases with at least 2 quiz phases within the same Puzzle session.
3. THE PuzzleEngine SHALL display a countdown timer during each phase and reduce the final score by 10% for each 30 seconds over par time.
4. WHEN the Player answers a quiz question correctly, THE PuzzleEngine SHALL trigger a particle burst visual effect and advance to the next phase.
5. IF the Player answers a quiz question incorrectly, THEN THE PuzzleEngine SHALL display the correct answer with an explanation and deduct 20 XP from the potential reward without terminating the Puzzle.
6. THE PuzzleEngine SHALL support a difficulty parameter (easy / medium / hard) that adjusts question complexity, timer duration and obstacle count.
7. WHEN the Player completes a Puzzle with a perfect score, THE PuzzleEngine SHALL award a Gold Medal collectible displayed in the Player's profile.
8. THE PuzzleEngine SHALL persist the Player's best score per Puzzle in the SaveSystem and display it on the Puzzle launch screen.
9. FOR ALL Puzzles that include an encoding or cipher phase, THE PuzzleEngine SHALL verify that decoding the encoded output produces the original input (round-trip property).

---

### Requirement 5: Sistema de Dificultad Progresiva y Adaptativa

**User Story:** As a Player, I want the game's difficulty to grow as I progress and adapt to my skill level, so that the game is always challenging but never frustratingly hard.

#### Acceptance Criteria

1. THE Game SHALL define 3 DifficultyTiers: Explorador (player levels 1–4), Investigador (levels 5–8) and Maestro (levels 9+), unlocked automatically as the Player progresses.
2. WHEN the Player advances to a new DifficultyTier, THE Game SHALL unlock new level variants, NPC interactions and harder Puzzle configurations specific to that tier.
3. THE AdaptiveDifficulty system SHALL track the Player's success rate over the last 10 HybridChallenge interactions and store it in the SaveSystem.
4. WHEN the Player's success rate falls below 40% over the last 10 interactions, THE AdaptiveDifficulty system SHALL automatically offer a hint before the next quiz phase and reduce the active timer by 20%.
5. WHEN the Player's success rate exceeds 85% over the last 10 interactions, THE AdaptiveDifficulty system SHALL reduce the XP reward for easy questions by 30% and surface harder questions from CurriculumService.
6. THE Game SHALL allow the Player to manually override the DifficultyTier from the settings menu, operating within that tier's bounds.
7. WHEN a campaign level is completed with 3 stars, THE LevelManager SHALL unlock a challenge variant of that level with a stricter par time and additional obstacles.
8. THE Game SHALL display the current DifficultyTier badge on the HUD at all times.

---

### Requirement 6: Sistema de Misiones (Quest System)

**User Story:** As a Player, I want a structured quest system with clear goals, progress tracking and meaningful rewards, so that I always know what to do next and feel driven by the story.

#### Acceptance Criteria

1. THE QuestSystem SHALL support 4 Quest types: MainQuest, SideQuest, DailyChallenge and ExplorationQuest.
2. WHEN the Player accepts a Quest, THE QuestSystem SHALL add it to the Active Quests list and place visible objective markers above relevant NPCs or locations in the WorldMap.
3. THE QuestSystem SHALL support multi-objective Quests with both sequential and parallel objective modes.
4. WHEN all objectives of a Quest are completed, THE QuestSystem SHALL mark the Quest as complete, grant rewards, update NarrativeState and trigger the corresponding NPC reaction.
5. THE QuestSystem SHALL generate one DailyChallenge Quest per calendar day derived from the active CurriculumService course, resetting at midnight local time.
6. WHEN a DailyChallenge Quest expires without completion, THE QuestSystem SHALL replace it with a new DailyChallenge Quest without penalising the Player.
7. THE QuestSystem SHALL implement ExplorationQuests that reward the Player for discovering hidden Zones, Relics and secret NPCs without placing markers on the map.
8. IF a SideQuest has prerequisites (a specific NPC Relationship Score or a completed MainQuest), THEN THE QuestSystem SHALL hide the SideQuest until all prerequisites are satisfied.
9. THE Quest Journal UIModal SHALL display Quest objectives as a numbered checklist with completion checkboxes, current objective highlighted and estimated XP reward shown.

---

### Requirement 7: Nuevos Niveles de Campaña con Mecánicas Únicas

**User Story:** As a Player, I want each campaign level to introduce a unique mechanic and increase in difficulty, so that every level feels fresh and tests different abilities.

#### Acceptance Criteria

1. THE LevelManager SHALL support at least 15 campaign levels divided evenly across the 3 DifficultyTiers (5 per tier).
2. EACH campaign level SHALL implement exactly one primary unique mechanic from the following set: timed platforming, gravity inversion, magnetic blocks, fog of war, mirror rooms, ice surfaces or wind gusts.
3. WHEN the Player enters a new level, THE Game SHALL display a 5-second tutorial tooltip explaining the unique mechanic of that level.
4. THE LevelBuilder SHALL support HybridChallenge gates: locked doors that open only when the Player answers a curriculum question correctly.
5. WHEN the Player completes a level for the first time, THE LevelManager SHALL award XP, coins and stars per the existing formula and additionally record a Level Badge in the Player's profile.
6. THE LevelBuilder SHALL support emissive Three.js materials for atmospheric effects such as lava glow, neon corridors and glowing Collectibles.
7. WHEN a level is replayed, THE LevelBuilder SHALL randomise the positions of at least 30% of Collectibles to increase replayability.
8. THE Game SHALL display a level preview screen showing name, description, mechanic hint, best time and star rating before the Player confirms entry.

---

### Requirement 8: Minijuegos Satisfactorios y Entretenidos

**User Story:** As a Player, I want varied minigames that are fun on their own terms, so that the game entertains me beyond the educational content.

#### Acceptance Criteria

1. THE MinigameManager SHALL register at least 6 Minigames: Carrera de Obstáculos, Búsqueda del Tesoro, Baloncesto Matemático, Torneo de Velocidad de Escritura, Laberinto de Física and Construcción de Palabras.
2. WHEN the Player launches a Minigame, THE MinigameManager SHALL display a rules screen with objective, controls and best score before starting the session.
3. WHEN a Minigame session ends, THE MinigameManager SHALL display a result screen with score, time, comparison to personal best and XP reward.
4. THE MinigameManager SHALL persist the Player's best score per Minigame in the SaveSystem.
5. WHEN the Player sets a new personal best in a Minigame, THE Game SHALL display a "New Record" animation and award a bonus of 25 coins.
6. THE Game SHALL unlock Minigames progressively: the first 2 Minigames SHALL be available from the start, and subsequent Minigames SHALL unlock upon completing specific Quests.
7. WHILE a Minigame session is active, THE Game SHALL disable all HUD elements not relevant to the Minigame to reduce visual noise.
8. THE Baloncesto Matemático Minigame SHALL generate arithmetic questions with correct numeric answers and only accept the answer that matches the ball labeled with the correct result.

---

### Requirement 9: Sistema de Árbol de Habilidades (Skill Tree)

**User Story:** As a Player, I want to spend earned points to unlock permanent skills that improve my gameplay, so that I feel my character growing stronger and more capable over time.

#### Acceptance Criteria

1. THE ProgressionManager SHALL award 1 Skill Point per player level-up, stored in the Player's persistent profile.
2. THE Game SHALL expose a SkillTree UIModal with at least 18 Skills organised into 3 branches: Explorador (movement bonuses), Académico (quiz bonuses) and Artesano (crafting and collectible bonuses).
3. WHEN the Player spends a Skill Point to unlock a Skill, THE ProgressionManager SHALL immediately apply the Skill's effect to the Player's stats and persist the change via the SaveSystem.
4. THE SkillTree SHALL enforce prerequisites: a Skill at depth N SHALL only be purchasable when the Player has already unlocked at least 1 Skill at depth N−1 in the same branch.
5. WHEN the Player attempts to purchase a Skill without sufficient Skill Points, THE SkillTree UIModal SHALL display an error message and highlight the Skill Point counter on the HUD.
6. THE Explorador branch SHALL include at least one Skill that increases the Player's sprint speed by 15% and one Skill that extends the jump height by 20%.
7. THE Académico branch SHALL include at least one Skill that doubles the XP reward for perfect Puzzle completions and one Skill that reveals the correct answer once per Puzzle session.
8. THE Game SHALL display the Player's available Skill Points in the HUD alongside the XP bar.

---

### Requirement 10: Economía Ampliada y Tienda In-Game

**User Story:** As a Player, I want a rich in-game economy where I can earn and spend coins to personalise my avatar and unlock abilities, so that progression feels rewarding and expressive.

#### Acceptance Criteria

1. THE Shop SHALL be expanded to offer at least 20 purchasable items across 4 categories: Accesorios de Avatar, Mejoras de Mochila, Decoraciones de Zona and Consumibles de Puzzle.
2. WHEN the Player purchases an item, THE ProgressionManager SHALL deduct the correct coin price, add the item to the Player's inventory and persist the change via the SaveSystem.
3. THE Shop SHALL display items the Player cannot yet afford with a locked appearance and a coin deficit indicator.
4. THE Game SHALL award coins through at least 5 distinct sources: Quest completion, Puzzle completion, Collectible pickup, DailyChallenge bonus, and level-up bonus.
5. WHEN the Player equips a purchased Avatar accessory, THE Avatar SHALL display the accessory immediately in the 3D scene without a reload.
6. THE Shop SHALL display the Player's current coin balance prominently at the top of the UIModal.
7. WHEN the Player opens the Shop, THE Shop UIModal SHALL animate items into view with a staggered entrance transition of 50ms between each item.
8. THE Game SHALL include at least 3 limited-time seasonal Collectibles that are only available during specific calendar periods.

---

### Requirement 11: Sistema de Audio Dinámico

**User Story:** As a Player, I want immersive background music, sound effects, and audio feedback, so that the game feels alive and every action has satisfying sensory response.

#### Acceptance Criteria

1. THE AudioManager SHALL play a unique looping background music track for each Zone, cross-fading over 2 seconds when the Player transitions between Zones.
2. THE AudioManager SHALL play distinct sound effects for: Collectible pickup, Quest completion, Puzzle correct answer, Puzzle wrong answer, NPC interaction start, level complete and Player jump.
3. WHEN the Player completes a level with 3 stars, THE AudioManager SHALL play a victory fanfare distinct from the standard level-complete sound.
4. THE Game SHALL expose a Settings UIModal where the Player can independently adjust Music Volume and SFX Volume using sliders from 0% to 100%.
5. WHEN the Player sets a volume slider to 0%, THE AudioManager SHALL mute the corresponding audio channel without stopping playback state.
6. THE AudioManager SHALL persist volume settings in the SaveSystem and restore them on next session start.
7. THE Game SHALL implement ambient soundscape effects per Zone (e.g. wind, lab machinery hum, crowd cheer in sports zone).
8. WHILE a dialogue is active, THE AudioManager SHALL lower the background music volume by 60% and restore it to the previous level when the dialogue closes.

---

### Requirement 12: Ciclo Día/Noche y Sistema Meteorológico

**User Story:** As a Player, I want the world to feel alive with a day/night cycle and changing weather, so that the environment feels dynamic and creates atmosphere.

#### Acceptance Criteria

1. THE DayNightCycle SHALL complete one full cycle (morning → afternoon → evening → night) every 20 real minutes, cycling continuously.
2. WHEN the DayNightCycle transitions between phases, THE SceneManager SHALL smoothly interpolate ambient light color and intensity over 60 seconds.
3. WHILE the in-game time is Night, THE SceneManager SHALL activate streetlamp point lights throughout the WorldMap and reduce ambient light intensity to 20% of daytime value.
4. THE Game SHALL implement at least 3 weather states: Clear, Cloudy and Rain, transitioning randomly between them with a minimum interval of 5 minutes.
5. WHEN the Rain weather state is active, THE SceneManager SHALL render a particle system simulating rain droplets visible from the Player's camera.
6. WHILE the Rain weather state is active, THE PhysicsWorld SHALL apply a surface friction multiplier of 0.7 to all ground colliders, making movement slightly slippery.
7. THE Game SHALL include weather-specific NPC dialogue lines: NPCs SHALL comment on rain or clear skies if the Player interacts with them during those conditions.
8. THE DayNightCycle current phase SHALL be displayed as a small icon on the HUD minimap.

---

### Requirement 13: Sistema de Guardado Robusto y Perfiles de Jugador

**User Story:** As a Player, I want my progress to be automatically saved and recoverable across sessions, and to be able to maintain multiple player profiles, so that I never lose my hard-earned progress.

#### Acceptance Criteria

1. THE SaveSystem SHALL auto-save the complete game state (ProgressionManager, CampaignProgress, NarrativeState, SkillTree, QuestSystem) after every significant event: Quest completion, level completion, Puzzle completion and Zone transition.
2. THE SaveSystem SHALL store all data in localStorage under versioned keys (e.g. kiro_save_v3) and SHALL migrate data from earlier versions on first load without data loss.
3. IF localStorage is unavailable or returns a parsing error, THEN THE SaveSystem SHALL log a warning, create a fresh default save state and continue without crashing.
4. THE Game SHALL support at least 3 independent Player profiles selectable from a profile selection screen shown before the main game.
5. WHEN the Player selects a profile, THE SaveSystem SHALL load all state associated with that profile and apply it to all game systems before entering the WorldMap.
6. THE Game SHALL display a profile summary card per profile showing player name, rank, total XP, number of Quests completed and playtime in hours and minutes.
7. WHEN the Player requests to delete a profile, THE Game SHALL show a confirmation UIModal and only delete the profile data after explicit confirmation.
8. THE SaveSystem SHALL export the active profile as a JSON file when the Player clicks "Export Save" in the settings, enabling external backup.

---

### Requirement 14: Sistema de Logros y Tabla de Clasificación

**User Story:** As a Player, I want to earn achievements for special accomplishments and compare my score with others, so that I feel proud of my achievements and motivated to keep improving.

#### Acceptance Criteria

1. THE Game SHALL define at least 30 Achievements covering exploration, academic performance, Quest completion, Puzzle mastery and social interaction categories.
2. WHEN the Player meets the unlock condition for an Achievement, THE Game SHALL display an Achievement unlock toast notification with the Achievement icon and name.
3. THE Game SHALL expose an Achievements UIModal accessible from the HUD displaying all Achievements with their unlock condition, earned date and locked/unlocked status.
4. WHEN an Achievement is unlocked, THE ProgressionManager SHALL award a coin bonus specific to each Achievement (range 20 to 200 coins) and persist it via the SaveSystem.
5. THE Game SHALL maintain a session Leaderboard in localStorage that stores the top 10 high scores per Minigame, sortable by score descending.
6. WHEN the Player sets a score that enters the top 10 Leaderboard for a Minigame, THE Game SHALL display a Leaderboard entry animation and record the score with timestamp.
7. THE Achievements UIModal SHALL display a progress bar for Achievements that require cumulative actions (e.g. "Answer 50 questions correctly").
8. THE Game SHALL include a hidden Achievement for each HistoricalFigure that is unlocked by completing all of that figure's associated Puzzles.

---

### Requirement 15: Pulido Visual y Feedback de Jugador

**User Story:** As a Player, I want smooth animations, responsive feedback and a polished visual presentation, so that the game feels professional and satisfying to play.

#### Acceptance Criteria

1. THE Avatar SHALL have 5 animation states: idle, walk, run, jump and interact, each transitioning with a blend duration of no more than 150ms.
2. WHEN the Player collects a Collectible, THE Game SHALL play a particle burst effect at the Collectible's world position and a pickup sound effect simultaneously.
3. WHEN the Player completes a Quest, THE Game SHALL display a full-screen overlay with a radial particle effect for 2 seconds before returning to the WorldMap.
4. THE Game SHALL display a screen-edge vignette effect that pulses red when the Player is in a timed challenge with less than 10 seconds remaining.
5. WHEN the Player opens any UIModal, THE Game SHALL animate the modal in with a scale-up ease-out transition of 200ms duration.
6. THE Game SHALL render at a minimum of 30 frames per second on a device capable of running a modern browser without GPU acceleration.
7. WHEN the Player pauses the game via the Escape key or a pause button, THE Game SHALL display a Pause UIModal and stop all game logic updates without stopping the Three.js render loop.
8. THE Game SHALL display a loading progress bar during Zone transitions that reflects actual asset loading progress from 0% to 100%.
