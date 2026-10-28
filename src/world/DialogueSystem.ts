import { EventBus } from '../core/EventBus';
import { AudioManager } from '../audio/AudioManager';
import { SaveSystem } from '../storage/SaveSystem';
import {
  NPC_PROFILES,
  DialogueTree,
  DialogueNode,
  DialogueChoice
} from './NPCDialogueData';

export interface NarrativeStateData {
  version: number;
  completedQuestIds: string[];
  activeQuestIds: string[];
  dialogueChoices: Record<string, string>;
  relationships: Record<string, number>;
  discoveredSecrets: string[];
}

export class DialogueSystem {
  private static instance: DialogueSystem | null = null;
  private isActive = false;
  private currentTree: DialogueTree | null = null;
  private currentNodeId: string | null = null;
  private lineIndex = 0;
  private currentText = '';
  private fullTargetText = '';
  private typewriterInterval: any = null;
  private isTyping = false;

  private activeSpeakerId = '';
  private relationships: Record<string, number> = {};
  private idleLineIndices: Record<string, number> = {};
  private dialogueChoices: Record<string, string> = {};

  private domContainer: HTMLElement | null = null;

  private constructor() {
    this.hydrateFromSave();
  }

  public static getInstance(): DialogueSystem {
    if (!DialogueSystem.instance) {
      DialogueSystem.instance = new DialogueSystem();
    }
    return DialogueSystem.instance;
  }

  public static resetInstance(): void {
    DialogueSystem.instance = null;
  }

  public hydrateFromSave(): void {
    const save = SaveSystem.getInstance().load();
    if (save && save.narrative) {
      this.relationships = { ...(save.narrative.relationships || {}) };
      this.dialogueChoices = { ...(save.narrative.dialogueChoices || {}) };
    }
  }

  public isDialogueActive(): boolean {
    return this.isActive;
  }

  public getRelationshipScore(npcId: string): number {
    return this.relationships[npcId] ?? 0;
  }

  /**
   * Modifies the relationship score, strictly clamped to [-100, +100].
   * Feature: complete-game-expansion, Property 5
   */
  public modifyRelationship(npcId: string, delta: number): number {
    const current = this.relationships[npcId] ?? 0;
    const clamped = Math.max(-100, Math.min(100, current + delta));
    this.relationships[npcId] = clamped;

    EventBus.getInstance().emit('npc:relationshipChanged', { npcId, score: clamped });
    SaveSystem.getInstance().save({
      narrative: {
        ...SaveSystem.getInstance().load().narrative,
        relationships: { ...this.relationships }
      }
    });

    return clamped;
  }

  public getRelationshipTier(npcId: string): 'hostile' | 'neutral' | 'friendly' {
    const score = this.getRelationshipScore(npcId);
    if (score <= -30) return 'hostile';
    if (score >= 30) return 'friendly';
    return 'neutral';
  }

  /**
   * Rotates through idle lines without immediate repetition (Req 3.9).
   */
  public getNextIdleLine(npcId: string): string {
    const profile = NPC_PROFILES[npcId];
    if (!profile || !profile.idleLines || profile.idleLines.length === 0) {
      return '¡Hola! Qué buen día para estudiar.';
    }

    const currentIdx = this.idleLineIndices[npcId] ?? 0;
    const line = profile.idleLines[currentIdx];
    this.idleLineIndices[npcId] = (currentIdx + 1) % profile.idleLines.length;
    return line;
  }

  public startDialogue(npcId: string, tree?: DialogueTree): void {
    const profile = NPC_PROFILES[npcId];
    this.activeSpeakerId = npcId;
    this.isActive = true;

    // Duck audio during dialogue (Req 11.8)
    AudioManager.getInstance().duckMusic(0.4, 0.4);
    AudioManager.getInstance().playSfx('npc_interact');

    if (tree) {
      this.currentTree = tree;
      this.currentNodeId = tree.rootNodeId;
      this.lineIndex = 0;
      this.renderDialogueBox(profile?.name || 'Personaje', profile?.portrait || '💬', profile?.role || '');
      this.showNode(tree.nodes[tree.rootNodeId]);
    } else {
      // Fallback to rotating idle line
      const idleText = this.getNextIdleLine(npcId);
      this.renderDialogueBox(profile?.name || 'Personaje', profile?.portrait || '💬', profile?.role || '');
      this.startTypewriter(idleText, () => {
        this.renderChoices([]);
      });
    }
  }

  public advanceLine(): void {
    if (this.isTyping) {
      this.finishTypewriter();
      return;
    }

    if (!this.currentTree || !this.currentNodeId) {
      this.closeDialogue();
      return;
    }

    const node = this.currentTree.nodes[this.currentNodeId];
    if (!node) {
      this.closeDialogue();
      return;
    }

    if (this.lineIndex < node.lines.length - 1) {
      this.lineIndex++;
      this.startTypewriter(node.lines[this.lineIndex].text, () => {
        if (this.lineIndex === node.lines.length - 1 && node.choices) {
          this.renderChoices(node.choices);
        }
      });
    } else if (node.choices && node.choices.length > 0) {
      this.renderChoices(node.choices);
    } else {
      this.closeDialogue();
    }
  }

  public selectChoice(choiceIndex: number): void {
    if (!this.currentTree || !this.currentNodeId) return;
    const node = this.currentTree.nodes[this.currentNodeId];
    if (!node || !node.choices || !node.choices[choiceIndex]) return;

    const choice = node.choices[choiceIndex];

    // Record decision in NarrativeState
    this.dialogueChoices[`${this.activeSpeakerId}_${node.id}`] = choice.text;

    // Execute side-effect if defined
    if (choice.sideEffect) {
      this.executeSideEffect(choice.sideEffect);
    }

    // Branch to next node
    const nextNode = this.currentTree.nodes[choice.nextNodeId];
    if (nextNode) {
      this.currentNodeId = choice.nextNodeId;
      this.lineIndex = 0;
      this.showNode(nextNode);
    } else {
      this.closeDialogue();
    }
  }

  private executeSideEffect(sideEffect: any): void {
    switch (sideEffect.type) {
      case 'modifyRelationship':
        this.modifyRelationship(this.activeSpeakerId, sideEffect.payload as number);
        break;
      case 'startQuest':
        EventBus.getInstance().emit('quest:accepted', { questId: sideEffect.payload as string });
        break;
      case 'unlockZone':
        EventBus.getInstance().emit('zone:unlocked', { zoneId: sideEffect.payload });
        break;
    }
  }

  private showNode(node: DialogueNode): void {
    if (!node || !node.lines || node.lines.length === 0) {
      this.closeDialogue();
      return;
    }

    const line = node.lines[this.lineIndex];
    this.startTypewriter(line.text, () => {
      if (this.lineIndex === node.lines.length - 1 && node.choices) {
        this.renderChoices(node.choices);
      }
    });
  }

  private startTypewriter(text: string, onComplete?: () => void): void {
    this.fullTargetText = text;
    this.currentText = '';
    this.isTyping = true;

    if (this.typewriterInterval) {
      clearInterval(this.typewriterInterval);
    }

    const textEl = document.getElementById('dialogue-text-body');
    const indicatorEl = document.getElementById('dialogue-advance-indicator');
    if (indicatorEl) indicatorEl.style.display = 'none';

    // 40 characters per second = 1 character every 25ms (Req 3.4)
    let charIdx = 0;
    this.typewriterInterval = setInterval(() => {
      if (charIdx < text.length) {
        this.currentText += text[charIdx];
        if (textEl) textEl.textContent = this.currentText;
        charIdx++;
      } else {
        this.finishTypewriter(onComplete);
      }
    }, 25);
  }

  private finishTypewriter(onComplete?: () => void): void {
    if (this.typewriterInterval) {
      clearInterval(this.typewriterInterval);
      this.typewriterInterval = null;
    }

    this.isTyping = false;
    this.currentText = this.fullTargetText;
    const textEl = document.getElementById('dialogue-text-body');
    if (textEl) textEl.textContent = this.fullTargetText;

    const indicatorEl = document.getElementById('dialogue-advance-indicator');
    if (indicatorEl) indicatorEl.style.display = 'block';

    if (onComplete) {
      onComplete();
    }
  }

  public closeDialogue(): void {
    this.isActive = false;
    this.currentTree = null;
    this.currentNodeId = null;

    if (this.typewriterInterval) {
      clearInterval(this.typewriterInterval);
      this.typewriterInterval = null;
    }

    if (this.domContainer) {
      this.domContainer.remove();
      this.domContainer = null;
    }

    // Restore music volume
    AudioManager.getInstance().unduckMusic(0.5);
  }

  private renderDialogueBox(name: string, portrait: string, role: string): void {
    if (typeof document === 'undefined') return;

    if (this.domContainer) {
      this.domContainer.remove();
    }

    const overlay = document.createElement('div');
    overlay.id = 'dialogue-overlay-container';
    overlay.className = 'dialogue-overlay';

    overlay.innerHTML = `
      <div class="dialogue-box">
        <div class="dialogue-header">
          <div class="dialogue-speaker-badge">${portrait}</div>
          <div class="dialogue-speaker-info">
            <h3 class="dialogue-speaker-name">${name}</h3>
            <span class="dialogue-speaker-role">${role}</span>
          </div>
          <button id="btn-dialogue-close" class="btn-icon">✕</button>
        </div>

        <div class="dialogue-body" id="dialogue-click-area">
          <p class="dialogue-text" id="dialogue-text-body"></p>
          <div class="dialogue-advance-hint" id="dialogue-advance-indicator">Pulsa para continuar ▸</div>
        </div>

        <div class="dialogue-choices" id="dialogue-choices-container"></div>
      </div>
    `;

    document.body.appendChild(overlay);
    this.domContainer = overlay;

    const clickArea = overlay.querySelector('#dialogue-click-area');
    if (clickArea) {
      clickArea.addEventListener('click', () => this.advanceLine());
    }

    const closeBtn = overlay.querySelector('#btn-dialogue-close');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => this.closeDialogue());
    }
  }

  private renderChoices(choices: DialogueChoice[]): void {
    const container = document.getElementById('dialogue-choices-container');
    if (!container) return;
    container.innerHTML = '';

    const validChoices = choices.filter((c) => this.isChoiceAvailable(c));

    if (validChoices.length === 0) {
      const btn = document.createElement('button');
      btn.className = 'btn-primary btn-dialogue-choice';
      btn.textContent = 'Terminar conversación';
      btn.addEventListener('click', () => this.closeDialogue());
      container.appendChild(btn);
      return;
    }

    validChoices.forEach((choice, index) => {
      const btn = document.createElement('button');
      btn.className = 'btn-option btn-dialogue-choice';
      btn.textContent = choice.text;
      btn.addEventListener('click', () => this.selectChoice(index));
      container.appendChild(btn);
    });
  }

  private isChoiceAvailable(choice: DialogueChoice): boolean {
    if (!choice.condition) return true;
    const cond = choice.condition;

    if (cond.type === 'relationship') {
      const score = this.getRelationshipScore(cond.referenceId || this.activeSpeakerId);
      const targetVal = Number(cond.value);
      if (cond.operator === '>=') return score >= targetVal;
      if (cond.operator === '<=') return score <= targetVal;
      if (cond.operator === '==') return score === targetVal;
    }
    return true;
  }

  public serializeNarrative(): NarrativeStateData {
    return {
      version: 1,
      completedQuestIds: [],
      activeQuestIds: [],
      dialogueChoices: { ...this.dialogueChoices },
      relationships: { ...this.relationships },
      discoveredSecrets: []
    };
  }

  public hydrateNarrative(data: NarrativeStateData): void {
    if (!data) return;
    this.dialogueChoices = { ...(data.dialogueChoices || {}) };
    this.relationships = { ...(data.relationships || {}) };
  }
}
