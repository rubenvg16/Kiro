import { ProgressionManager } from './ProgressionManager';
import { CurriculumService } from '../curriculum/CurriculumService';
import { CampaignProgressStore } from './CampaignProgress';

export interface LMSQuest {
  id: string;
  source: 'reto' | 'adicional';
  title: string;
  subject: string;
  description: string;
  rewardXP: number;
  rewardCoins: number;
  completed: boolean;
  /** FALSE cuando el reto todavía no se puede reclamar. */
  available: boolean;
}

/** Recompensa de un reto ya superado. */
export interface QuestReward {
  xp: number;
  coins: number;
}

/** Identificador del reto adicional generado a partir de la campaña. */
export const CAMPAIGN_QUEST_ID = 'campaña_desafio';

export class LMSBridgeService {
  /**
   * Retos disponibles: los curriculares del curso activo más un reto
   * adicional generado a partir de la campaña de niveles.
   */
  public static getQuests(): LMSQuest[] {
    const progression = ProgressionManager.getInstance();
    const curriculum = CurriculumService.getInstance();
    const courseChallenges = curriculum.getChallenges();

    const courseQuests: LMSQuest[] = courseChallenges.map((ch) => ({
      id: ch.id,
      source: 'reto',
      title: ch.title,
      subject: `${ch.subject} (${curriculum.getCourse().name})`,
      description: ch.description,
      rewardXP: ch.rewardXP,
      rewardCoins: ch.rewardCoins,
      completed: progression.progress.completedQuests.includes(ch.id),
      available: true
    }));

    return [...courseQuests, this.getCampaignQuest(progression)];
  }

  /**
   * Reto adicional: el progreso de la campaña de niveles es una fuente de
   * retos que no viene del currículo, así que se expone como quest "adicional".
   *
   * Sólo se puede reclamar cuando el alumno ha superado AL MENOS un nivel:
   * si no, el reto se cobraría al empezar la campaña con la recompensa
   * mínima y quedaría bloqueado para siempre.
   */
  private static getCampaignQuest(progression: ProgressionManager): LMSQuest {
    const campaign = CampaignProgressStore.load();
    const results = Object.values(campaign.results);
    const completed = results.filter(result => result.completed).length;
    const total = Math.max(1, campaign.unlocked.length);
    const stars = results.reduce((sum, result) => sum + result.stars, 0);
    const available = completed > 0;

    return {
      id: CAMPAIGN_QUEST_ID,
      source: 'adicional',
      title: 'Desafío de la campaña de niveles',
      subject: 'Campaña de Niveles',
      description: available
        ? `Supera retos de la campaña del IES: ${completed} nivel(es) completado(s) y ${stars} estrellas conseguidas de ${total} disponibles.`
        : 'Supera al menos un nivel de la campaña del IES para desbloquear este reto.',
      rewardXP: 120 + stars * 20,
      rewardCoins: 60 + stars * 5,
      completed: progression.progress.completedQuests.includes(CAMPAIGN_QUEST_ID),
      available
    };
  }

  /**
   * Marca un reto como completado y devuelve la recompensa que debe
   * otorgar el llamante (evita duplicar la escritura en el almacenamiento).
   *
   * @returns La recompensa del reto o NULL si no existe o ya estaba superado.
   */
  public static completeQuest(questId: string): QuestReward | null {
    const progression = ProgressionManager.getInstance();
    if (progression.progress.completedQuests.includes(questId)) {
      return null;
    }

    const quest = this.getQuests().find(candidate => candidate.id === questId);
    if (!quest) return null;
    // Un reto bloqueado (aún sin requisitos cumplidos) no se puede reclamar
    if (!quest.available) return null;

    progression.progress.completedQuests.push(questId);
    return { xp: quest.rewardXP, coins: quest.rewardCoins };
  }
}
