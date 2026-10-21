import * as THREE from 'three';
import { SceneManager } from './core/SceneManager';
import { PhysicsWorld } from './core/physics';
import { SCHOOL_BOX_COLLIDERS, SCHOOL_SPHERE_COLLIDERS } from './world/WorldColliders';
import { AvatarModel, AvatarConfig } from './avatar/AvatarModel';
import { SnapshotService } from './avatar/SnapshotService';
import { AvatarStorage } from './storage/AvatarStorage';
import { WorldEnvironment } from './world/WorldEnvironment';
import { InputManager } from './world/InputManager';
import type { MovementVector } from './world/InputManager';
import { PlayerController } from './world/PlayerController';
import { InteractionManager } from './world/InteractionManager';
import { ProgressionManager, SECRET_RELICS, SHOP_ITEMS } from './gamification/ProgressionManager';
import { CollectiblesManager } from './world/CollectiblesManager';
import { LMSBridgeService } from './gamification/LMSBridgeService';
import { CurriculumService } from './curriculum/CurriculumService';
import { NPCManager } from './world/NPCManager';
import type { SchoolNPC } from './world/NPCManager';
import { HistoricalFiguresManager } from './world/HistoricalFiguresManager';
import type { HistoricalFigure } from './world/HistoricalFiguresManager';
import { SecretRelicsManager } from './world/SecretRelicsManager';
import { CalculatorModal } from './tools/CalculatorModal';
import { WhiteboardModal } from './tools/WhiteboardModal';
import { LevelManager } from './levels/LevelManager';
import { LEVEL_ORIGIN } from './levels/types';
import type { LevelDefinition, LevelResult, LevelRuntimeState } from './levels/types';
import { PuzzleEngine } from './puzzles/PuzzleEngine';

/**
 * Búsqueda tipada de elementos del DOM. Devuelve NULL si no existe, de modo
 * que ninguna referencia del HTML pueda romper el arranque del juego.
 */
const getEl = <T extends HTMLElement>(id: string): T | null =>
  document.getElementById(id) as T | null;

/** ¿Hay algún modal abierto? (incluye calculadora, pizarra y puzzles) */
function isModalOpen(): boolean {
  return document.querySelector('.modal:not(.hidden)') !== null;
}

/** Vector de movimiento nulo: el alumno no se mueve con ningún modal abierto. */
const ZERO_MOVEMENT: MovementVector = {
  x: 0,
  y: 0,
  isMoving: false,
  isSprinting: false,
  jumpPressed: false,
  jumpHeld: false
};

/** Formatea segundos como mm:ss. */
function formatTime(seconds: number): string {
  const safe = Math.max(0, Math.round(seconds));
  const minutes = Math.floor(safe / 60);
  const rest = safe % 60;
  return `${minutes.toString().padStart(2, '0')}:${rest.toString().padStart(2, '0')}`;
}

/** Etiqueta legible de la dificultad de un nivel. */
function difficultyLabel(difficulty: LevelDefinition['difficulty']): string {
  if (difficulty === 'facil') return 'Fácil';
  if (difficulty === 'media') return 'Media';
  return 'Difícil';
}

/** HTML de las tres estrellas de un nivel. */
function renderStars(count: number): string {
  const stars = Math.max(0, Math.min(3, Math.round(count)));
  let html = '';
  for (let index = 0; index < 3; index += 1) {
    html += index < stars ? '★' : '<span class="empty">★</span>';
  }
  return html;
}

/**
 * Aviso flotante. Reutiliza el mecanismo de toast existente del juego
 * (`.pickup-toast`): se crea, se muestra y se retira solo.
 */
function showToast(message: string): void {
  const toast = document.createElement('div');
  toast.className = 'pickup-toast';
  toast.textContent = message;
  document.body.appendChild(toast);

  setTimeout(() => {
    toast.classList.add('fade-out');
    setTimeout(() => toast.remove(), 400);
  }, 3500);
}

// 1. Cargar configuración persistida
const defaultConfig: AvatarConfig = {
  skinColor: '#f5cda6',
  shirtColor: '#3b82f6',
  pantsColor: '#1e293b',
  accessory: 'none'
};
const currentConfig = AvatarStorage.loadConfig(defaultConfig);

// 2. Herramientas Escolares Interactivas
const calculator = CalculatorModal.getInstance();
const whiteboard = WhiteboardModal.getInstance();

// 3. Sistema de Currículo Español
const curriculum = CurriculumService.getInstance();
const hudCourseName = getEl('hud-course-name');

curriculum.subscribe((c) => {
  if (hudCourseName) hudCourseName.textContent = c.name;
});

// 4. Sistema de Progresión y Recompensas
const progression = ProgressionManager.getInstance();
const hudRankPill = getEl('hud-rank-pill');
const hudXpFill = getEl('hud-xp-fill');
const hudXpText = getEl('hud-xp-text');
const hudCoins = getEl('hud-coins');

/** Último rango visto, para detectar un ascenso y avisar al alumno. */
let lastKnownRankLevel = progression.progress.level;

// 5. Paletas de colores
const skinPalettes = ['#ffd6a5', '#f5cda6', '#d4a373', '#9c6644', '#582f0e'];
const shirtPalettes = ['#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#1e293b'];
const pantsPalettes = ['#1e293b', '#334155', '#475569', '#15803d', '#991b1b'];

// 6. Inicializar Escena 3D
const container = getEl('canvas-container');
if (!container) {
  throw new Error('No se encuentra el contenedor del canvas en el documento.');
}
const sceneManager = new SceneManager(container);

// Avatar
const avatar = new AvatarModel(currentConfig);
sceneManager.scene.add(avatar.group);

// Entorno del Patio del IES 3D
const worldEnvironment = new WorldEnvironment();
worldEnvironment.group.visible = false;
sceneManager.scene.add(worldEnvironment.group);

// Gestores del Mundo
const collectiblesManager = new CollectiblesManager();
worldEnvironment.group.add(collectiblesManager.group);

const secretRelicsManager = new SecretRelicsManager();
worldEnvironment.group.add(secretRelicsManager.group);

const npcManager = new NPCManager();
worldEnvironment.group.add(npcManager.group);

const historicalFiguresManager = new HistoricalFiguresManager();
worldEnvironment.group.add(historicalFiguresManager.group);

// Mundo físico: los colliders del patio se registran en el motor
const physicsWorld = new PhysicsWorld();
for (const box of SCHOOL_BOX_COLLIDERS) {
  physicsWorld.addStaticBox(
    new THREE.Vector3(box.center[0], box.center[1], box.center[2]),
    new THREE.Vector3(box.half[0], box.half[1], box.half[2]),
    { id: box.id, friction: box.friction, restitution: box.restitution },
  );
}
for (const sphere of SCHOOL_SPHERE_COLLIDERS) {
  physicsWorld.addStaticSphere(
    new THREE.Vector3(sphere.center[0], sphere.center[1], sphere.center[2]),
    sphere.radius,
    { id: sphere.id, friction: sphere.friction, restitution: sphere.restitution },
  );
}

// Input, Controlador de Jugador e Interacciones
const inputManager = new InputManager();
const playerController = new PlayerController(
  avatar,
  physicsWorld,
  sceneManager.renderer.domElement,
);
const interactionManager = new InteractionManager();

// Campaña de niveles
const levelManager = new LevelManager(sceneManager.scene, physicsWorld);

// Elementos del Banner de Interacción
const poiBanner = getEl('poi-banner');
const btnInteract = getEl<HTMLButtonElement>('btn-interact');

// Modal de Diálogo
const dialogueModal = getEl('dialogue-modal');
const dialogueNpcBadge = getEl('dialogue-npc-badge');
const dialogueNpcName = getEl('dialogue-npc-name');
const dialogueNpcRole = getEl('dialogue-npc-role');
const dialogueText = getEl('dialogue-text');
const btnDialogueQuiz = getEl<HTMLButtonElement>('btn-dialogue-quiz');
const btnCloseDialogue = getEl<HTMLButtonElement>('btn-close-dialogue');

let currentNearNPC: SchoolNPC | null = null;
let currentNearFigure: HistoricalFigure | null = null;
/**
 * Sujeto (figura histórica o NPC) que abrió el diálogo. Se captura al
 * abrirlo para que el botón de reto actúe SIEMPRE sobre ese personaje, aunque
 * el jugador se aleje mientras el modal está abierto.
 */
let dialogueSubject: HistoricalFigure | SchoolNPC | null = null;

/** TRUE mientras el control del alumno está suspendido por un modal abierto. */
let playerSuspended = false;

/** ID del nivel siguiente al que se puede saltar desde el modal de resultados. */
let nextLevelId: string | null = null;

// 7. Loop de actualización en cada frame
sceneManager.setUpdateCallback((delta: number) => {
  if (sceneManager.currentMode === 'customizer') {
    avatar.updateAnimation(delta, false, true, false);
    return;
  }

  // Con un modal abierto el alumno no camina ni salta
  const modalOpen = isModalOpen();
  if (modalOpen !== playerSuspended) {
    playerSuspended = modalOpen;
    playerController.setEnabled(!modalOpen);
  }
  const movement = modalOpen ? ZERO_MOVEMENT : inputManager.getMovement();
  playerController.update(delta, movement, sceneManager.camera);

  if (sceneManager.currentMode === 'levels') {
    // El nivel se actualiza ANTES del paso de física para que los empujones
    // apliquen en el mismo frame.
    levelManager.update(delta, playerController.position);
    physicsWorld.step(delta);
    // En la campaña no hay figuras ni NPC: se limpian para que la tecla E
    // no pueda abrir un diálogo obsoleto del patio.
    currentNearFigure = null;
    currentNearNPC = null;
    interactionManager.hideBanner();
    if (poiBanner) poiBanner.classList.add('hidden');
    return;
  }

  // Los cuerpos dinámicos se integran en el motor físico
  physicsWorld.step(delta);
  collectiblesManager.update(delta, playerController.position);
  secretRelicsManager.update(delta, playerController.position);

  // Actualizar NPCs y Figuras Históricas
  const nearFigure = historicalFiguresManager.update(delta, playerController.position);
  const nearNPC = npcManager.update(delta, playerController.position);
  currentNearFigure = nearFigure;
  currentNearNPC = nearNPC;

  // La proximidad se comprueba SIEMPRE: el POI activo nunca queda obsoleto
  interactionManager.checkProximity(playerController.position, worldEnvironment.pois);

  // Prioridad del cartel: figura histórica > NPC > punto de interés
  if (modalOpen) {
    interactionManager.hideBanner();
  } else if (nearFigure) {
    interactionManager.setBannerContent(nearFigure.badge, nearFigure.name, nearFigure.title);
  } else if (nearNPC) {
    interactionManager.setBannerContent(nearNPC.badge, nearNPC.name, nearNPC.role);
  } else {
    const poi = interactionManager.getActivePOI();
    if (poi) {
      interactionManager.setBannerContent(poi.badge, poi.name, poi.description);
    } else {
      interactionManager.hideBanner();
    }
  }
});

// Interacción con Personajes Históricos y Profesores
function openFigureDialogue(fig: HistoricalFigure): void {
  if (!dialogueModal) return;
  const randomLine = fig.dialogue[Math.floor(Math.random() * fig.dialogue.length)];

  if (dialogueNpcBadge) dialogueNpcBadge.textContent = fig.badge;
  if (dialogueNpcName) dialogueNpcName.textContent = fig.name;
  if (dialogueNpcRole) dialogueNpcRole.textContent = `${fig.title} (${fig.era})`;
  if (dialogueText) dialogueText.textContent = `"${randomLine}"`;
  if (btnDialogueQuiz) btnDialogueQuiz.textContent = '¡Aceptar el Enigma!';

  dialogueSubject = fig;
  dialogueModal.classList.remove('hidden');
}

function openNPCDialogue(npc: SchoolNPC): void {
  if (!dialogueModal) return;
  const randomLine = npc.dialogue[Math.floor(Math.random() * npc.dialogue.length)];

  if (dialogueNpcBadge) dialogueNpcBadge.textContent = npc.badge;
  if (dialogueNpcName) dialogueNpcName.textContent = npc.name;
  if (dialogueNpcRole) dialogueNpcRole.textContent = npc.role;
  if (dialogueText) dialogueText.textContent = `"${randomLine}"`;
  if (btnDialogueQuiz) {
    btnDialogueQuiz.textContent = npc.challengeSubject
      ? `¡Reto de ${npc.challengeSubject}!`
      : '¡Hacer Cuestionario del Aula!';
  }

  dialogueSubject = npc;
  dialogueModal.classList.remove('hidden');
}

/**
 * Despacho único de interacción: figura histórica > NPC > punto de interés.
 * Es el único sitio desde el que se abre una actividad.
 */
function dispatchInteraction(): void {
  if (isModalOpen()) return;
  // La interacción con figuras, NPC y POI sólo existe en el patio: en la
  // campaña el pulsador E no debe abrir nada del instituto.
  if (sceneManager.currentMode !== 'world') return;

  if (currentNearFigure) {
    openFigureDialogue(currentNearFigure);
    return;
  }
  if (currentNearNPC) {
    openNPCDialogue(currentNearNPC);
    return;
  }
  const poi = interactionManager.getActivePOI();
  if (poi) {
    interactionManager.openActivityModal(poi);
  }
}

btnInteract?.addEventListener('click', () => {
  dispatchInteraction();
});

window.addEventListener('keydown', (e) => {
  if (e.key.toLowerCase() !== 'e') return;
  if (isModalOpen()) return;
  dispatchInteraction();
});

btnCloseDialogue?.addEventListener('click', () => {
  dialogueModal?.classList.add('hidden');
  dialogueSubject = null;
});

btnDialogueQuiz?.addEventListener('click', () => {
  const subject = dialogueSubject;
  dialogueModal?.classList.add('hidden');
  dialogueSubject = null;
  if (!subject) return;

  if ('puzzleAction' in subject) {
    // Las figuras históricas conservan su propio enigma
    subject.puzzleAction();
    return;
  }

  // Los NPC ofrecen el reto de su materia (nunca el aula genérica)
  const aulaPOI = worldEnvironment.pois.find(p => p.id === 'aula_informatica');
  if (aulaPOI) {
    interactionManager.openActivityModal(aulaPOI, subject.challengeSubject);
  }
});

// 8. Botones de Herramientas y Medallero
getEl('btn-open-calculator')?.addEventListener('click', () => calculator.open());
getEl('btn-open-whiteboard')?.addEventListener('click', () => whiteboard.open());
getEl('btn-activity-calc')?.addEventListener('click', () => calculator.open());
getEl('btn-activity-board')?.addEventListener('click', () => whiteboard.open());

// Medallero Modal
const relicsModal = getEl('relics-modal');
const relicsGrid = getEl('relics-grid');
const btnCloseRelicsModal = getEl<HTMLButtonElement>('btn-close-relics-modal');

function renderRelicsAlbum() {
  if (!relicsGrid) return;
  relicsGrid.innerHTML = '';

  SECRET_RELICS.forEach((relic) => {
    const isUnlocked = progression.isRelicUnlocked(relic.id);
    const card = document.createElement('div');
    card.className = `relic-card ${isUnlocked ? 'unlocked' : 'locked'}`;
    card.innerHTML = `
      <div class="relic-icon-box">${relic.icon}</div>
      <div class="relic-info">
        <h4>${relic.name}</h4>
        <p class="relic-hint">${isUnlocked ? relic.rewardDescription : `Pista: ${relic.locationHint}`}</p>
        <span class="relic-status-badge ${isUnlocked ? 'found' : 'missing'}">
          ${isUnlocked ? '✨ Conseguida' : '🔒 Oculta en el patio'}
        </span>
      </div>
    `;
    relicsGrid.appendChild(card);
  });
}

getEl('btn-open-relics')?.addEventListener('click', () => {
  renderRelicsAlbum();
  relicsModal?.classList.remove('hidden');
});

btnCloseRelicsModal?.addEventListener('click', () => {
  relicsModal?.classList.add('hidden');
});

// 9. Cambio de Modo (Personalizador vs Patio del IES vs Campaña de Niveles)
const tabCustomizer = getEl<HTMLButtonElement>('tab-customizer');
const tabWorld = getEl<HTMLButtonElement>('tab-world');
const tabLevels = getEl<HTMLButtonElement>('tab-levels');
const uiPanel = getEl('ui-panel');
const worldHud = getEl('world-hud');
const levelHud = getEl('level-hud');
const SCHOOL_ORIGIN = new THREE.Vector3(0, 0, 0);

/** Marca la pestaña activa del selector de modos. */
function setActiveTab(mode: 'customizer' | 'world' | 'levels'): void {
  tabCustomizer?.classList.toggle('active', mode === 'customizer');
  tabWorld?.classList.toggle('active', mode === 'world');
  tabLevels?.classList.toggle('active', mode === 'levels');
}

function switchToCustomizer() {
  if (levelManager.currentLevel) {
    levelManager.unloadLevel();
  }
  levelHud?.classList.add('hidden');
  interactionManager.hideBanner();

  uiPanel?.classList.remove('hidden');
  worldHud?.classList.add('hidden');

  worldEnvironment.group.visible = false;
  playerController.setPosition(0, 0, 0);
  sceneManager.focusLightingOn(SCHOOL_ORIGIN);
  sceneManager.setMode('customizer');
  setActiveTab('customizer');
}

function switchToWorld() {
  levelManager.unloadLevel();
  levelHud?.classList.add('hidden');
  interactionManager.hideBanner();

  uiPanel?.classList.add('hidden');
  worldHud?.classList.remove('hidden');

  worldEnvironment.group.visible = true;
  playerController.setPosition(0, 0, 0);
  sceneManager.focusLightingOn(SCHOOL_ORIGIN);
  sceneManager.setMode('world');
  setActiveTab('world');
}

tabCustomizer?.addEventListener('click', switchToCustomizer);
tabWorld?.addEventListener('click', switchToWorld);

// 10. Campaña de Niveles
const levelSelectModal = getEl('level-select-modal');
const levelSelectGrid = getEl('level-select-grid');
const btnCloseLevelSelect = getEl<HTMLButtonElement>('btn-close-level-select');

const levelName = getEl('level-name');
const levelObjective = getEl('level-objective');
const levelTokens = getEl('level-tokens');
const levelBodies = getEl('level-bodies');
const levelTimer = getEl('level-timer');
const levelPar = getEl('level-par');
const btnLevelHint = getEl<HTMLButtonElement>('btn-level-hint');
const btnLevelExit = getEl<HTMLButtonElement>('btn-level-exit');

const levelCompleteModal = getEl('level-complete-modal');
const levelCompleteStars = getEl('level-complete-stars');
const levelCompleteTitle = getEl('level-complete-title');
const levelCompleteTime = getEl('level-complete-time');
const levelCompleteBest = getEl('level-complete-best');
const levelCompleteRewards = getEl('level-complete-rewards');
const btnLevelRetry = getEl<HTMLButtonElement>('btn-level-retry');
const btnLevelNext = getEl<HTMLButtonElement>('btn-level-next');
const btnLevelBack = getEl<HTMLButtonElement>('btn-level-back');

/** Pinta el HUD de la campaña con el estado del nivel. */
function renderLevelHud(state: LevelRuntimeState): void {
  if (levelName) levelName.textContent = state.name;
  if (levelObjective) levelObjective.textContent = state.objectiveText;

  if (levelTokens) {
    levelTokens.hidden = state.collectTotal <= 0;
    levelTokens.innerHTML = `🪙 <strong>${state.collected}/${state.collectTotal}</strong>`;
  }
  if (levelBodies) {
    levelBodies.hidden = state.physicsTotal <= 0;
    levelBodies.innerHTML = `🧍 <strong>${state.physicsCurrent}/${state.physicsTotal}</strong>`;
  }
  if (levelTimer) levelTimer.textContent = formatTime(state.elapsedSeconds);

  const level = levelManager.currentLevel;
  if (levelPar) {
    levelPar.textContent = `Par ${formatTime(level ? level.parTimeSeconds : 0)}`;
  }
}

/** Pinta las tarjetas del selector de niveles. */
function renderLevelSelect(): void {
  if (!levelSelectGrid) return;
  levelSelectGrid.innerHTML = '';

  levelManager.levels.forEach((level) => {
    const unlocked = levelManager.isUnlocked(level.id);
    const stars = levelManager.getStars(level.id);
    const best = levelManager.getBestTime(level.id);
    const selected = levelManager.currentLevel?.id === level.id;

    const card = document.createElement('div');
    card.className = `level-card${unlocked ? '' : ' locked'}${selected ? ' selected' : ''}`;
    card.innerHTML = `
      <div class="level-card-header">
        <h4>${level.name}</h4>
        <span class="difficulty-badge ${level.difficulty}">${difficultyLabel(level.difficulty)}</span>
      </div>
      <p class="level-description">${level.description}</p>
      <div class="level-stars">${renderStars(stars)}</div>
      <div class="level-stats">
        <span>⏱️ Par: ${formatTime(level.parTimeSeconds)}</span>
        ${best !== null ? `<span>🏅 Mejor: ${formatTime(best)}</span>` : ''}
        <span>🌟 +${level.rewards.xp} Puntos</span>
        <span>🪙 +${level.rewards.coins} Monedas</span>
      </div>
      ${unlocked ? '' : '<span class="level-lock-hint">🔒 Completa el nivel anterior</span>'}
    `;

    if (unlocked) {
      card.addEventListener('click', () => {
        startLevel(level.id);
      });
    }

    levelSelectGrid.appendChild(card);
  });
}

/** Carga un nivel de la campaña (sólo los desbloqueados). */
function startLevel(levelId: string): void {
  if (!levelManager.isUnlocked(levelId)) {
    showToast('🔒 Completa el nivel anterior para desbloquear este reto.');
    return;
  }
  levelManager.loadLevel(levelId);
}

/** Pinta el modal de nivel completado. */
function renderLevelComplete(result: LevelResult): void {
  if (levelCompleteStars) levelCompleteStars.textContent = renderStars(result.stars);
  if (levelCompleteTitle) levelCompleteTitle.textContent = `¡Nivel superado: ${result.name}!`;
  if (levelCompleteTime) levelCompleteTime.textContent = `Tiempo: ${formatTime(result.timeSeconds)}`;
  if (levelCompleteBest) {
    levelCompleteBest.textContent = result.bestTimeSeconds !== null
      ? `Mejor tiempo: ${formatTime(result.bestTimeSeconds)}`
      : 'Mejor tiempo: --';
  }
  if (levelCompleteRewards) {
    levelCompleteRewards.textContent = `Recompensa: +${result.xp} Puntos · +${result.coins} 🪙`;
  }

  const index = levelManager.levels.findIndex(level => level.id === result.levelId);
  const next = index >= 0 ? levelManager.levels[index + 1] : undefined;
  nextLevelId = next ? next.id : null;
  if (btnLevelNext) btnLevelNext.hidden = !next;
}

levelManager.onLevelStart = (level: LevelDefinition) => {
  worldEnvironment.group.visible = false;
  interactionManager.hideBanner();
  if (poiBanner) poiBanner.classList.add('hidden');

  levelHud?.classList.remove('hidden');
  // El HUD del mundo aporta el joystick y los botones táctiles: sin él el
  // alumno no puede moverse en un nivel si venía del personalizador.
  worldHud?.classList.remove('hidden');
  sceneManager.setMode('levels');
  sceneManager.focusLightingOn(LEVEL_ORIGIN);
  setActiveTab('levels');

  const spawn = levelManager.getSpawnWorldPosition();
  playerController.setPosition(spawn.x, spawn.y, spawn.z);

  levelSelectModal?.classList.add('hidden');
  renderLevelSelect();
  showToast(`🎮 ${level.name}: ${level.description}`);
};

levelManager.onLevelProgress = (state: LevelRuntimeState) => {
  renderLevelHud(state);
};

levelManager.onLevelComplete = (result: LevelResult) => {
  renderLevelComplete(result);
  renderLevelSelect();
  levelCompleteModal?.classList.remove('hidden');
};

levelManager.onHint = (message: string) => {
  showToast(`💡 ${message}`);
};

levelManager.onRespawnRequested = (position: THREE.Vector3) => {
  playerController.setPosition(position.x, position.y, position.z);
};

tabLevels?.addEventListener('click', () => {
  renderLevelSelect();
  levelSelectModal?.classList.remove('hidden');
});

btnCloseLevelSelect?.addEventListener('click', () => {
  levelSelectModal?.classList.add('hidden');
});

btnLevelHint?.addEventListener('click', () => {
  const state = levelManager.currentState;
  if (!state) {
    showToast('💡 Selecciona un nivel para empezar.');
    return;
  }
  showToast(`💡 ${state.objectiveText}`);
});

btnLevelExit?.addEventListener('click', () => {
  switchToWorld();
});

btnLevelRetry?.addEventListener('click', () => {
  levelCompleteModal?.classList.add('hidden');
  levelManager.restart();
  const spawn = levelManager.getSpawnWorldPosition();
  playerController.setPosition(spawn.x, spawn.y, spawn.z);
});

btnLevelNext?.addEventListener('click', () => {
  levelCompleteModal?.classList.add('hidden');
  if (nextLevelId) {
    startLevel(nextLevelId);
  }
});

btnLevelBack?.addEventListener('click', () => {
  levelCompleteModal?.classList.add('hidden');
  switchToWorld();
});

// 11. Modal de Selección de Curso Escolar
const btnSelectCourse = getEl<HTMLButtonElement>('btn-select-course');
const courseModal = getEl('course-modal');
const courseListContainer = getEl('course-list-container');
const btnCloseCourseModal = getEl<HTMLButtonElement>('btn-close-course-modal');

function renderCourseSelector() {
  if (!courseListContainer) return;
  const allCourses = curriculum.getAllCourses();
  const currentCourse = curriculum.getCourse();

  const stages: Record<string, typeof allCourses> = {
    'Primaria': [],
    'Educación Secundaria Obligatoria (E.S.O.)': [],
    'Bachillerato': []
  };

  allCourses.forEach((c) => {
    if (c.stage === 'Primaria') stages['Primaria'].push(c);
    else if (c.stage === 'ESO') stages['Educación Secundaria Obligatoria (E.S.O.)'].push(c);
    else stages['Bachillerato'].push(c);
  });

  courseListContainer.innerHTML = '';

  Object.entries(stages).forEach(([stageName, courses]) => {
    if (courses.length === 0) return;

    const group = document.createElement('div');
    group.className = 'stage-group';
    group.innerHTML = `<h4>${stageName}</h4>`;

    const grid = document.createElement('div');
    grid.className = 'course-chip-grid';

    courses.forEach((c) => {
      const btn = document.createElement('button');
      btn.className = `course-chip-btn ${c.id === currentCourse.id ? 'active' : ''}`;
      btn.textContent = c.name;
      btn.addEventListener('click', () => {
        curriculum.setCourse(c.id);
        renderCourseSelector();
        renderQuestsList();
        courseModal?.classList.add('hidden');
      });
      grid.appendChild(btn);
    });

    group.appendChild(grid);
    courseListContainer.appendChild(group);
  });
}

btnSelectCourse?.addEventListener('click', () => {
  renderCourseSelector();
  courseModal?.classList.remove('hidden');
});

btnCloseCourseModal?.addEventListener('click', () => {
  courseModal?.classList.add('hidden');
});

// 12. Configurar UI de Paletas
function createColorSwatches(
  containerId: string,
  colors: string[],
  initialSelected: string,
  onSelect: (color: string) => void
) {
  const elem = getEl(containerId);
  if (!elem) return;

  colors.forEach((color) => {
    const swatch = document.createElement('button');
    swatch.className = `color-swatch ${color.toLowerCase() === initialSelected.toLowerCase() ? 'active' : ''}`;
    swatch.style.backgroundColor = color;
    swatch.setAttribute('aria-label', `Color ${color}`);

    swatch.addEventListener('click', () => {
      elem.querySelectorAll('.color-swatch').forEach(s => s.classList.remove('active'));
      swatch.classList.add('active');
      onSelect(color);
      AvatarStorage.saveConfig(currentConfig);
    });

    elem.appendChild(swatch);
  });
}

createColorSwatches('skin-colors', skinPalettes, currentConfig.skinColor, (color) => {
  currentConfig.skinColor = color;
  avatar.setSkinColor(color);
});

createColorSwatches('shirt-colors', shirtPalettes, currentConfig.shirtColor, (color) => {
  currentConfig.shirtColor = color;
  avatar.setShirtColor(color);
});

createColorSwatches('pants-colors', pantsPalettes, currentConfig.pantsColor, (color) => {
  currentConfig.pantsColor = color;
  avatar.setPantsColor(color);
});

// Accesorios (los que no se han comprado aparecen bloqueados)
const accessoryButtons = Array.from(
  document.querySelectorAll<HTMLButtonElement>('#accessory-options .btn-option')
);

/** Equipa un accesorio en el avatar y lo guarda. */
function equipAccessory(accessory: AvatarConfig['accessory']): void {
  currentConfig.accessory = accessory;
  avatar.setAccessory(accessory);
  AvatarStorage.saveConfig(currentConfig);
  renderAccessoryButtons();
}

/** Actualiza el estado (activo/bloqueado) de los botones de accesorio. */
function renderAccessoryButtons(): void {
  accessoryButtons.forEach((btn) => {
    const accessory = (btn.dataset.accessory || 'none') as AvatarConfig['accessory'];
    const owned = progression.isItemUnlocked(accessory);
    btn.disabled = !owned;
    btn.classList.toggle('locked', !owned);
    btn.classList.toggle('active', accessory === currentConfig.accessory);
    btn.title = owned ? '' : '🔒 Cómpralo en la tienda de accesorios';
  });
}

accessoryButtons.forEach((btn) => {
  const accessory = (btn.dataset.accessory || 'none') as AvatarConfig['accessory'];

  btn.addEventListener('click', () => {
    if (!progression.isItemUnlocked(accessory)) {
      showToast('🔒 Ese accesorio todavía no está comprado.');
      return;
    }
    equipAccessory(accessory);
  });
});

renderAccessoryButtons();

// 13. Tienda de accesorios (las monedas tienen destino)
const shopItemsList = getEl('shop-items-list');
const shopCoins = getEl('shop-coins');

/** Pinta la tienda y el estado de los botones de compra. */
function renderShop(): void {
  if (shopCoins) shopCoins.textContent = `${progression.progress.coins}`;
  if (!shopItemsList) return;

  shopItemsList.innerHTML = '';

  SHOP_ITEMS.forEach((item) => {
    const owned = progression.isItemUnlocked(item.id);
    const affordable = progression.progress.coins >= item.price;

    const row = document.createElement('div');
    row.className = `shop-item${owned ? ' owned' : ''}`;
    row.innerHTML = `
      <span class="shop-item-icon">${item.icon}</span>
      <span class="shop-item-name">${item.name}</span>
      <span class="shop-item-price">🪙 ${item.price}</span>
      ${owned ? '<span class="shop-item-hint">✔ Comprado</span>' : ''}
      ${!owned && !affordable ? '<span class="shop-item-hint">🔒</span>' : ''}
      <button class="btn btn-success btn-sm" id="btn-buy-${item.id}" ${owned || !affordable ? 'disabled' : ''}>
        ${owned ? 'Comprado' : 'Comprar'}
      </button>
    `;

    const buyBtn = row.querySelector<HTMLButtonElement>(`#btn-buy-${item.id}`);
    buyBtn?.addEventListener('click', () => {
      const bought = progression.buyItem(item.id);
      if (bought) {
        equipAccessory(item.id as AvatarConfig['accessory']);
        showToast(`🛍️ ¡Compraste ${item.name}! Ya lo llevas puesto.`);
      } else {
        showToast('⛔ No has podido comprar ese accesorio.');
      }
      renderShop();
      renderAccessoryButtons();
    });

    shopItemsList.appendChild(row);
  });
}

renderShop();

// 14. Modal y Captura de Foto de Perfil
const btnSnapshot = getEl<HTMLButtonElement>('btn-snapshot');
const snapshotModal = getEl('snapshot-modal');
const snapshotImg = getEl<HTMLImageElement>('snapshot-img');
const btnDownload = getEl<HTMLAnchorElement>('btn-download');
const btnCloseModal = getEl<HTMLButtonElement>('btn-close-modal');

btnSnapshot?.addEventListener('click', () => {
  const dataUrl = SnapshotService.takeProfileSnapshot(
    sceneManager.renderer,
    sceneManager.scene,
    sceneManager.camera
  );

  if (snapshotImg) snapshotImg.src = dataUrl;
  if (btnDownload) btnDownload.href = dataUrl;
  snapshotModal?.classList.remove('hidden');
});

btnCloseModal?.addEventListener('click', () => {
  snapshotModal?.classList.add('hidden');
});

// 15. Modal de Retos Adicionales y Desafíos Voluntarios
const btnOpenQuests = getEl<HTMLButtonElement>('btn-open-quests');
const questsModal = getEl('quests-modal');
const questsList = getEl('quests-list');
const btnCloseQuests = getEl<HTMLButtonElement>('btn-close-quests');
const questsSubtitle = getEl('quests-subtitle');

function renderQuestsList() {
  if (!questsList) return;
  const currentCourse = curriculum.getCourse();
  if (questsSubtitle) {
    questsSubtitle.textContent = `Pruebas voluntarias adaptadas a ${currentCourse.name} para ganar puntos y monedas`;
  }

  const quests = LMSBridgeService.getQuests();
  questsList.innerHTML = '';

  if (quests.length === 0) {
    questsList.innerHTML = `<p style="color: #94a3b8; padding: 10px;">No hay retos pendientes para este curso actualmente.</p>`;
    return;
  }

  quests.forEach((q) => {
    const item = document.createElement('div');
    item.className = `quest-item ${q.completed ? 'completed' : ''}`;
    item.innerHTML = `
      <div class="quest-content">
        <span class="quest-source-badge">${q.subject}</span>
        <h4 class="quest-title">${q.title}</h4>
        <p style="font-size: 0.82rem; color: #94a3b8; margin: 4px 0;">${q.description}</p>
        <div class="quest-rewards">
          <span>🌟 +${q.rewardXP} Puntos</span>
          <span>🪙 +${q.rewardCoins} Monedas</span>
        </div>
      </div>
      <div>
        ${q.completed
          ? `<span class="badge-done" style="color: #34d399; font-weight: 700;">✅ Superado</span>`
          : `<button class="btn btn-success btn-sm btn-claim" data-id="${q.id}">Completar Reto</button>`
        }
      </div>
    `;

    const claimBtn = item.querySelector<HTMLButtonElement>('.btn-claim');
    if (claimBtn) {
      claimBtn.addEventListener('click', () => {
        const reward = LMSBridgeService.completeQuest(q.id);
        if (reward) {
          // El resultado del reto decide la recompensa (XP y monedas)
          PuzzleEngine.applyResult({
            solved: true,
            xpEarned: reward.xp,
            coinsEarned: reward.coins
          });
          showToast(`🏆 ¡Reto superado! +${reward.xp} Puntos y +${reward.coins} 🪙`);
        }
        renderQuestsList();
      });
    }

    questsList.appendChild(item);
  });
}

btnOpenQuests?.addEventListener('click', () => {
  renderQuestsList();
  questsModal?.classList.remove('hidden');
});

btnCloseQuests?.addEventListener('click', () => {
  questsModal?.classList.add('hidden');
});

// 16. Suscripción a la progresión (al final para tener todos los elementos)
progression.subscribe((p) => {
  if (hudRankPill) hudRankPill.textContent = p.rankTitle;
  if (hudCoins) hudCoins.textContent = `${p.coins}`;
  const pct = Math.min(100, Math.round((p.xp / p.xpToNextLevel) * 100));
  if (hudXpFill) hudXpFill.style.width = `${pct}%`;
  if (hudXpText) hudXpText.textContent = `${p.xp} / ${p.xpToNextLevel} Puntos`;

  // Ascenso de rango: el resultado de `addXP` se refleja con un aviso
  if (p.level > lastKnownRankLevel) {
    lastKnownRankLevel = p.level;
    showToast(`🎉 ¡Subiste de rango! Ahora eres ${p.rankTitle}`);
  }

  renderShop();
  renderAccessoryButtons();
});
