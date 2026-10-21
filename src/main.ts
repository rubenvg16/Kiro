import { SceneManager } from './core/SceneManager';
import { AvatarModel, AvatarConfig } from './avatar/AvatarModel';
import { SnapshotService } from './avatar/SnapshotService';
import { AvatarStorage } from './storage/AvatarStorage';
import { WorldEnvironment } from './world/WorldEnvironment';
import { InputManager } from './world/InputManager';
import { PlayerController } from './world/PlayerController';
import { InteractionManager } from './world/InteractionManager';
import { ProgressionManager, SECRET_RELICS } from './gamification/ProgressionManager';
import { CollectiblesManager } from './world/CollectiblesManager';
import { LMSBridgeService } from './gamification/LMSBridgeService';
import { CurriculumService } from './curriculum/CurriculumService';
import { NPCManager, SchoolNPC } from './world/NPCManager';
import { HistoricalFiguresManager, HistoricalFigure } from './world/HistoricalFiguresManager';
import { SecretRelicsManager } from './world/SecretRelicsManager';
import { CalculatorModal } from './tools/CalculatorModal';
import { WhiteboardModal } from './tools/WhiteboardModal';

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
const hudCourseName = document.getElementById('hud-course-name') as HTMLElement;

curriculum.subscribe((c) => {
  if (hudCourseName) hudCourseName.textContent = c.name;
});

// 4. Sistema de Progresión y Recompensas
const progression = ProgressionManager.getInstance();
const hudRankPill = document.getElementById('hud-rank-pill') as HTMLElement;
const hudXpFill = document.getElementById('hud-xp-fill') as HTMLElement;
const hudXpText = document.getElementById('hud-xp-text') as HTMLElement;
const hudCoins = document.getElementById('hud-coins') as HTMLElement;

progression.subscribe((p) => {
  if (hudRankPill) hudRankPill.textContent = p.rankTitle;
  if (hudCoins) hudCoins.textContent = `${p.coins}`;
  const pct = Math.min(100, Math.round((p.xp / p.xpToNextLevel) * 100));
  if (hudXpFill) hudXpFill.style.width = `${pct}%`;
  if (hudXpText) hudXpText.textContent = `${p.xp} / ${p.xpToNextLevel} Puntos`;
});

// 5. Paletas de colores
const skinPalettes = ['#ffd6a5', '#f5cda6', '#d4a373', '#9c6644', '#582f0e'];
const shirtPalettes = ['#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#1e293b'];
const pantsPalettes = ['#1e293b', '#334155', '#475569', '#15803d', '#991b1b'];

// 6. Inicializar Escena 3D
const container = document.getElementById('canvas-container') as HTMLElement;
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

// Input, Controlador de Jugador e Interacciones
const inputManager = new InputManager();
const playerController = new PlayerController(avatar);
const interactionManager = new InteractionManager();

// Elementos del Banner de Interacción
const poiBanner = document.getElementById('poi-banner') as HTMLElement;
const poiBadge = document.getElementById('poi-badge') as HTMLElement;
const poiTitle = document.getElementById('poi-title') as HTMLElement;
const poiDesc = document.getElementById('poi-desc') as HTMLElement;
const btnInteract = document.getElementById('btn-interact') as HTMLButtonElement;

// Modal de Diálogo
const dialogueModal = document.getElementById('dialogue-modal') as HTMLElement;
const dialogueNpcBadge = document.getElementById('dialogue-npc-badge') as HTMLElement;
const dialogueNpcName = document.getElementById('dialogue-npc-name') as HTMLElement;
const dialogueNpcRole = document.getElementById('dialogue-npc-role') as HTMLElement;
const dialogueText = document.getElementById('dialogue-text') as HTMLElement;
const btnDialogueQuiz = document.getElementById('btn-dialogue-quiz') as HTMLButtonElement;
const btnCloseDialogue = document.getElementById('btn-close-dialogue') as HTMLButtonElement;

let currentNearNPC: SchoolNPC | null = null;
let currentNearFigure: HistoricalFigure | null = null;

// 7. Loop de actualización en cada frame
sceneManager.setUpdateCallback((delta: number) => {
  if (sceneManager.currentMode === 'customizer') {
    avatar.updateAnimation(delta, false, true, false);
  } else {
    const movement = inputManager.getMovement();
    playerController.update(delta, movement, sceneManager.camera);
    collectiblesManager.update(delta, playerController.position);
    secretRelicsManager.update(delta, playerController.position);

    // Actualizar NPCs y Figuras Históricas
    const nearFigure = historicalFiguresManager.update(delta, playerController.position);
    const nearNPC = npcManager.update(delta, playerController.position);
    currentNearFigure = nearFigure;
    currentNearNPC = nearNPC;

    if (nearFigure) {
      if (poiBadge) poiBadge.textContent = nearFigure.badge;
      if (poiTitle) poiTitle.textContent = nearFigure.name;
      if (poiDesc) poiDesc.textContent = nearFigure.title;
      if (poiBanner) poiBanner.classList.remove('hidden');
    } else if (nearNPC) {
      if (poiBadge) poiBadge.textContent = nearNPC.badge;
      if (poiTitle) poiTitle.textContent = nearNPC.name;
      if (poiDesc) poiDesc.textContent = nearNPC.role;
      if (poiBanner) poiBanner.classList.remove('hidden');
    } else {
      interactionManager.checkProximity(playerController.position, worldEnvironment.pois);
    }
  }
});

// Interacción con Personajes Históricos y Profesores
function openFigureDialogue(fig: HistoricalFigure) {
  if (!dialogueModal) return;
  const randomLine = fig.dialogue[Math.floor(Math.random() * fig.dialogue.length)];

  if (dialogueNpcBadge) dialogueNpcBadge.textContent = fig.badge;
  if (dialogueNpcName) dialogueNpcName.textContent = fig.name;
  if (dialogueNpcRole) dialogueNpcRole.textContent = `${fig.title} (${fig.era})`;
  if (dialogueText) dialogueText.textContent = `"${randomLine}"`;
  if (btnDialogueQuiz) btnDialogueQuiz.textContent = '¡Aceptar el Enigma!';

  dialogueModal.classList.remove('hidden');
}

function openNPCDialogue(npc: SchoolNPC) {
  if (!dialogueModal) return;
  const randomLine = npc.dialogue[Math.floor(Math.random() * npc.dialogue.length)];

  if (dialogueNpcBadge) dialogueNpcBadge.textContent = npc.badge;
  if (dialogueNpcName) dialogueNpcName.textContent = npc.name;
  if (dialogueNpcRole) dialogueNpcRole.textContent = npc.role;
  if (dialogueText) dialogueText.textContent = `"${randomLine}"`;
  if (btnDialogueQuiz) btnDialogueQuiz.textContent = '¡Hacer Cuestionario del Aula!';

  dialogueModal.classList.remove('hidden');
}

btnInteract?.addEventListener('click', () => {
  if (currentNearFigure) {
    openFigureDialogue(currentNearFigure);
  } else if (currentNearNPC) {
    openNPCDialogue(currentNearNPC);
  }
});

window.addEventListener('keydown', (e) => {
  if (e.key.toLowerCase() === 'e' && dialogueModal.classList.contains('hidden')) {
    if (currentNearFigure) {
      openFigureDialogue(currentNearFigure);
    } else if (currentNearNPC) {
      openNPCDialogue(currentNearNPC);
    }
  }
});

btnCloseDialogue?.addEventListener('click', () => {
  dialogueModal.classList.add('hidden');
});

btnDialogueQuiz?.addEventListener('click', () => {
  dialogueModal.classList.add('hidden');
  if (currentNearFigure) {
    currentNearFigure.puzzleAction();
  } else {
    const gymPOI = worldEnvironment.pois.find(p => p.id === 'aula_informatica');
    if (gymPOI) {
      (interactionManager as any).openActivityModal(gymPOI);
    }
  }
});

// 8. Botones de Herramientas y Medallero
document.getElementById('btn-open-calculator')?.addEventListener('click', () => calculator.open());
document.getElementById('btn-open-whiteboard')?.addEventListener('click', () => whiteboard.open());
document.getElementById('btn-activity-calc')?.addEventListener('click', () => calculator.open());
document.getElementById('btn-activity-board')?.addEventListener('click', () => whiteboard.open());

// Medallero Modal
const relicsModal = document.getElementById('relics-modal') as HTMLElement;
const relicsGrid = document.getElementById('relics-grid') as HTMLElement;
const btnCloseRelicsModal = document.getElementById('btn-close-relics-modal') as HTMLButtonElement;

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

document.getElementById('btn-open-relics')?.addEventListener('click', () => {
  renderRelicsAlbum();
  relicsModal.classList.remove('hidden');
});

btnCloseRelicsModal?.addEventListener('click', () => {
  relicsModal.classList.add('hidden');
});

// 9. Cambio de Modo (Personalizador vs Patio del IES)
const tabCustomizer = document.getElementById('tab-customizer') as HTMLButtonElement;
const tabWorld = document.getElementById('tab-world') as HTMLButtonElement;
const uiPanel = document.getElementById('ui-panel') as HTMLElement;
const worldHud = document.getElementById('world-hud') as HTMLElement;

function switchToCustomizer() {
  tabCustomizer.classList.add('active');
  tabWorld.classList.remove('active');
  uiPanel.classList.remove('hidden');
  worldHud.classList.add('hidden');

  worldEnvironment.group.visible = false;
  playerController.setPosition(0, 0, 0);
  sceneManager.setMode('customizer');
}

function switchToWorld() {
  tabWorld.classList.add('active');
  tabCustomizer.classList.remove('active');
  uiPanel.classList.add('hidden');
  worldHud.classList.remove('hidden');

  worldEnvironment.group.visible = true;
  playerController.setPosition(0, 0, 0);
  sceneManager.setMode('world');
}

tabCustomizer.addEventListener('click', switchToCustomizer);
tabWorld.addEventListener('click', switchToWorld);

// 10. Modal de Selección de Curso Escolar
const btnSelectCourse = document.getElementById('btn-select-course') as HTMLButtonElement;
const courseModal = document.getElementById('course-modal') as HTMLElement;
const courseListContainer = document.getElementById('course-list-container') as HTMLElement;
const btnCloseCourseModal = document.getElementById('btn-close-course-modal') as HTMLButtonElement;

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
        courseModal.classList.add('hidden');
      });
      grid.appendChild(btn);
    });

    group.appendChild(grid);
    courseListContainer.appendChild(group);
  });
}

btnSelectCourse?.addEventListener('click', () => {
  renderCourseSelector();
  courseModal.classList.remove('hidden');
});

btnCloseCourseModal?.addEventListener('click', () => {
  courseModal.classList.add('hidden');
});

// 11. Configurar UI de Paletas
function createColorSwatches(
  containerId: string,
  colors: string[],
  initialSelected: string,
  onSelect: (color: string) => void
) {
  const elem = document.getElementById(containerId);
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

// Accesorios
const accessoryButtons = document.querySelectorAll<HTMLButtonElement>('#accessory-options .btn-option');
accessoryButtons.forEach((btn) => {
  const accessory = (btn.dataset.accessory || 'none') as AvatarConfig['accessory'];
  if (accessory === currentConfig.accessory) {
    btn.classList.add('active');
  } else {
    btn.classList.remove('active');
  }

  btn.addEventListener('click', () => {
    accessoryButtons.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentConfig.accessory = accessory;
    avatar.setAccessory(accessory);
    AvatarStorage.saveConfig(currentConfig);
  });
});

// 12. Modal y Captura de Foto de Perfil
const btnSnapshot = document.getElementById('btn-snapshot') as HTMLButtonElement;
const snapshotModal = document.getElementById('snapshot-modal') as HTMLElement;
const snapshotImg = document.getElementById('snapshot-img') as HTMLImageElement;
const btnDownload = document.getElementById('btn-download') as HTMLAnchorElement;
const btnCloseModal = document.getElementById('btn-close-modal') as HTMLButtonElement;

btnSnapshot?.addEventListener('click', () => {
  const dataUrl = SnapshotService.takeProfileSnapshot(
    sceneManager.renderer,
    sceneManager.scene,
    sceneManager.camera
  );

  snapshotImg.src = dataUrl;
  btnDownload.href = dataUrl;
  snapshotModal.classList.remove('hidden');
});

btnCloseModal?.addEventListener('click', () => {
  snapshotModal.classList.add('hidden');
});

// 13. Modal de Retos Adicionales y Desafíos Voluntarios
const btnOpenQuests = document.getElementById('btn-open-quests') as HTMLButtonElement;
const questsModal = document.getElementById('quests-modal') as HTMLElement;
const questsList = document.getElementById('quests-list') as HTMLElement;
const btnCloseQuests = document.getElementById('btn-close-quests') as HTMLButtonElement;
const questsSubtitle = document.getElementById('quests-subtitle') as HTMLElement;

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
        LMSBridgeService.completeQuest(q.id);
        renderQuestsList();
      });
    }

    questsList.appendChild(item);
  });
}

btnOpenQuests?.addEventListener('click', () => {
  renderQuestsList();
  questsModal.classList.remove('hidden');
});

btnCloseQuests?.addEventListener('click', () => {
  questsModal.classList.add('hidden');
});
