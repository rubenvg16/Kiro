import { EventBus } from '../core/EventBus';
import { AudioManager } from '../audio/AudioManager';
import { SaveSystem } from '../storage/SaveSystem';
import { ProgressionManager } from '../gamification/ProgressionManager';
import {
  Quest,
  QUEST_DEFINITIONS
} from './QuestDefinitions';

export class QuestSystem {
  private static instance: QuestSystem | null = null;
  private activeQuests: Map<string, Quest> = new Map();
  private completedQuestIds: Set<string> = new Set();
  private dailyQuest: Quest | null = null;

  private constructor() {
    this.hydrateFromSave();
    this.checkDailyReset();
  }

  public static getInstance(): QuestSystem {
    if (!QuestSystem.instance) {
      QuestSystem.instance = new QuestSystem();
    }
    return QuestSystem.instance;
  }

  public static resetInstance(): void {
    QuestSystem.instance = null;
  }

  public hydrateFromSave(): void {
    const save = SaveSystem.getInstance().load();
    if (save && save.questSystem) {
      this.completedQuestIds = new Set(save.questSystem.completedQuestIds || []);
      this.activeQuests.clear();

      for (const id of save.questSystem.activeQuestIds || []) {
        const def = QUEST_DEFINITIONS[id];
        if (def) {
          this.activeQuests.set(id, JSON.parse(JSON.stringify(def)));
        }
      }
    }
  }

  public getActiveQuests(): Quest[] {
    return Array.from(this.activeQuests.values());
  }

  public getDailyQuest(): Quest | null {
    return this.dailyQuest;
  }

  public getCompletedQuestIds(): string[] {
    return Array.from(this.completedQuestIds);
  }

  public isQuestCompleted(questId: string): boolean {
    return this.completedQuestIds.has(questId);
  }

  public isQuestActive(questId: string): boolean {
    return this.activeQuests.has(questId);
  }

  public isVisible(quest: Quest): boolean {
    if (this.completedQuestIds.has(quest.id)) return false;
    if (this.activeQuests.has(quest.id)) return true;

    if (!quest.prerequisites || quest.prerequisites.length === 0) {
      return true;
    }

    const save = SaveSystem.getInstance().load();
    const studentLevel = ProgressionManager.getInstance().progress.level;
    const relationships = save.narrative.relationships || {};

    for (const prereq of quest.prerequisites) {
      if (prereq.type === 'quest') {
        if (!this.completedQuestIds.has(prereq.referenceId)) return false;
      } else if (prereq.type === 'level') {
        const required = parseInt(prereq.referenceId, 10);
        if (studentLevel < required) return false;
      } else if (prereq.type === 'relationship') {
        const score = relationships[prereq.referenceId] ?? 0;
        const minVal = prereq.minValue ?? 30;
        if (score < minVal) return false;
      }
    }

    return true;
  }

  public getAvailableQuests(): Quest[] {
    return Object.values(QUEST_DEFINITIONS).filter(
      (q) => !this.completedQuestIds.has(q.id) && !this.activeQuests.has(q.id) && this.isVisible(q)
    );
  }

  public acceptQuest(questId: string): boolean {
    if (this.completedQuestIds.has(questId)) return false;
    if (this.activeQuests.has(questId)) return false;

    const def = QUEST_DEFINITIONS[questId];
    if (!def) return false;
    if (!this.isVisible(def)) return false;

    const questInstance: Quest = JSON.parse(JSON.stringify(def));
    this.activeQuests.set(questId, questInstance);

    EventBus.getInstance().emit('quest:accepted', { questId });
    AudioManager.getInstance().playSfx('quest_complete');
    this.persistState();

    return true;
  }

  public updateObjective(questId: string, objectiveId: string, progress: number | boolean = true): void {
    const quest = this.activeQuests.get(questId);
    if (!quest) return;

    const objIndex = quest.objectives.findIndex((o) => o.id === objectiveId);
    if (objIndex === -1) return;

    // Sequential mode check: prior objectives must be completed
    if (quest.objectiveMode === 'sequential' && objIndex > 0) {
      const priorCompleted = quest.objectives.slice(0, objIndex).every((o) => o.completed);
      if (!priorCompleted) return;
    }

    const targetObj = quest.objectives[objIndex];
    if (typeof progress === 'boolean') {
      targetObj.completed = progress;
    } else if (typeof progress === 'number' && targetObj.count) {
      targetObj.current = Math.min(targetObj.count, (targetObj.current || 0) + progress);
      targetObj.completed = targetObj.current >= targetObj.count;
    }

    this.checkCompletion(questId);
  }

  public checkCompletion(questId: string): boolean {
    const quest = this.activeQuests.get(questId);
    if (!quest) return false;

    const allCompleted = quest.objectives.every((o) => o.completed);
    if (!allCompleted) {
      this.persistState();
      return false;
    }

    // Complete quest
    this.activeQuests.delete(questId);
    this.completedQuestIds.add(questId);

    // Grant rewards immediately
    const progression = ProgressionManager.getInstance();
    progression.addXP(quest.rewards.xp);
    progression.addCoins(quest.rewards.coins);

    if (quest.rewards.itemIds) {
      for (const item of quest.rewards.itemIds) {
        if (!progression.progress.unlockedItems.includes(item)) {
          progression.progress.unlockedItems.push(item);
        }
      }
    }

    // Emit event & audio
    EventBus.getInstance().emit('quest:completed', {
      questId,
      xp: quest.rewards.xp,
      coins: quest.rewards.coins
    });
    AudioManager.getInstance().playSfx('quest_complete');

    this.persistState();
    return true;
  }

  public checkDailyReset(): void {
    const today = new Date().toISOString().split('T')[0];
    const save = SaveSystem.getInstance().load();

    if (save.questSystem.dailyQuestDate !== today) {
      this.generateDailyChallenge(today);
    }
  }

  public generateDailyChallenge(todayDate?: string): Quest {
    const dateKey = todayDate || new Date().toISOString().split('T')[0];
    const dailyQuestId = `daily_${dateKey}`;

    const daily: Quest = {
      id: dailyQuestId,
      type: 'DailyChallenge',
      title: '🎯 Reto Diario Escolar',
      description: 'Supera el cuestionario curricular diario para conseguir monedas y puntos de estudio extra.',
      objectiveMode: 'sequential',
      objectives: [
        {
          id: `${dailyQuestId}_obj1`,
          description: 'Responde correctamente a 3 preguntas curriculares',
          completed: false,
          type: 'solve',
          count: 3,
          current: 0
        }
      ],
      rewards: { xp: 200, coins: 100 }
    };

    this.dailyQuest = daily;
    if (!this.completedQuestIds.has(dailyQuestId) && !this.activeQuests.has(dailyQuestId)) {
      this.activeQuests.set(dailyQuestId, daily);
    }

    this.persistState(dateKey);
    return daily;
  }

  private persistState(dailyDate?: string): void {
    const currentDailyDate = dailyDate || new Date().toISOString().split('T')[0];
    SaveSystem.getInstance().save({
      questSystem: {
        activeQuestIds: Array.from(this.activeQuests.keys()),
        completedQuestIds: Array.from(this.completedQuestIds),
        dailyQuestDate: currentDailyDate
      }
    });
  }
}
