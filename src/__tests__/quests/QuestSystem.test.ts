import { describe, it, expect, beforeEach } from 'vitest';
import { QuestSystem } from '../../quests/QuestSystem';
import { QUEST_DEFINITIONS } from '../../quests/QuestDefinitions';
import { ProgressionManager } from '../../gamification/ProgressionManager';
import { EventBus } from '../../core/EventBus';

describe('QuestSystem and Journal', () => {
  let questSystem: QuestSystem;

  beforeEach(() => {
    localStorage.clear();
    EventBus.getInstance().clear();
    ProgressionManager.getInstance().progress.xp = 0;
    ProgressionManager.getInstance().progress.coins = 0;
    ProgressionManager.getInstance().progress.completedQuests = [];
    QuestSystem.resetInstance();
    questSystem = QuestSystem.getInstance();
  });

  it('allows accepting visible quest without prerequisites and blocks locked quests', () => {
    // main_quest_1 has no prerequisites
    const accepted1 = questSystem.acceptQuest('main_quest_1');
    expect(accepted1).toBe(true);
    expect(questSystem.isQuestActive('main_quest_1')).toBe(true);

    // main_quest_2 requires main_quest_1 completed
    const accepted2 = questSystem.acceptQuest('main_quest_2');
    expect(accepted2).toBe(false);
  });

  it('progresses sequential objectives in strict order', () => {
    questSystem.acceptQuest('main_quest_1');

    // Attempting to complete objective 2 before objective 1 should be ignored in sequential mode
    questSystem.updateObjective('main_quest_1', 'mq1_obj2', true);
    const quest = questSystem.getActiveQuests().find((q) => q.id === 'main_quest_1');
    expect(quest?.objectives[1].completed).toBe(false);

    // Complete objective 1 first
    questSystem.updateObjective('main_quest_1', 'mq1_obj1', true);
    expect(quest?.objectives[0].completed).toBe(true);

    // Now objective 2 can complete
    questSystem.updateObjective('main_quest_1', 'mq1_obj2', true);
    expect(questSystem.isQuestCompleted('main_quest_1')).toBe(true);
  });

  it('awards XP and coins immediately upon completing all quest objectives', () => {
    const progression = ProgressionManager.getInstance();
    const initialXP = progression.progress.xp;
    const initialCoins = progression.progress.coins;

    questSystem.acceptQuest('main_quest_1');
    questSystem.updateObjective('main_quest_1', 'mq1_obj1', true);
    questSystem.updateObjective('main_quest_1', 'mq1_obj2', true);

    expect(questSystem.isQuestCompleted('main_quest_1')).toBe(true);
    expect(progression.progress.xp).toBe(initialXP + QUEST_DEFINITIONS.main_quest_1.rewards.xp);
    expect(progression.progress.coins).toBe(initialCoins + QUEST_DEFINITIONS.main_quest_1.rewards.coins);
  });

  it('generates daily challenge with valid structure and date', () => {
    const daily = questSystem.generateDailyChallenge('2026-10-28');
    expect(daily.id).toBe('daily_2026-10-28');
    expect(daily.type).toBe('DailyChallenge');
    expect(daily.objectives.length).toBeGreaterThan(0);
  });

  it('guarantees main chain of 12 quests and two secondary chains of 5 quests each', () => {
    const mainChain = Object.values(QUEST_DEFINITIONS).filter((q) => q.chainId === 'certamen');
    expect(mainChain.length).toBe(12);

    const biblioChain = Object.values(QUEST_DEFINITIONS).filter((q) => q.chainId === 'biblioteca_mystery');
    expect(biblioChain.length).toBe(5);

    const sportsChain = Object.values(QUEST_DEFINITIONS).filter((q) => q.chainId === 'reto_deportivo');
    expect(sportsChain.length).toBe(5);
  });
});
