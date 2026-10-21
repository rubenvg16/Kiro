import { ProgressionManager } from './ProgressionManager';
import { CurriculumService } from '../curriculum/CurriculumService';

export interface LMSQuest {
  id: string;
  source: 'reto' | 'adicional';
  title: string;
  subject: string;
  description: string;
  rewardXP: number;
  rewardCoins: number;
  completed: boolean;
}

export class LMSBridgeService {
  public static getQuests(): LMSQuest[] {
    const progression = ProgressionManager.getInstance();
    const curriculum = CurriculumService.getInstance();
    const courseChallenges = curriculum.getChallenges();

    return courseChallenges.map((ch) => ({
      id: ch.id,
      source: 'reto',
      title: ch.title,
      subject: `${ch.subject} (${curriculum.getCourse().name})`,
      description: ch.description,
      rewardXP: ch.rewardXP,
      rewardCoins: ch.rewardCoins,
      completed: progression.progress.completedQuests.includes(ch.id)
    }));
  }

  public static completeQuest(questId: string): boolean {
    const progression = ProgressionManager.getInstance();
    const curriculum = CurriculumService.getInstance();
    const challenge = curriculum.getChallenges().find(c => c.id === questId);

    if (!challenge || progression.progress.completedQuests.includes(questId)) {
      return false;
    }

    progression.progress.completedQuests.push(questId);
    progression.addXP(challenge.rewardXP);
    progression.addCoins(challenge.rewardCoins);
    progression.saveProgress();
    return true;
  }
}
