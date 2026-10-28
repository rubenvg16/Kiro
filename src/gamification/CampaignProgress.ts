/**
 * Persistencia de la campaña de niveles.
 *
 * Usa su propia clave de almacenamiento (`kiro_campaign_v1`) para no mezclarse
 * con el XP/rango del `ProgressionManager` (que usa `edu_student_progress_v2`).
 */

export interface CampaignLevelResult {
  completed: boolean;
  stars: number;
  bestTimeSeconds: number | null;
  challengeVariantUnlocked?: boolean;
}

export interface CampaignProgress {
  /** Ids de los niveles desbloqueados explícitamente. */
  unlocked: string[];
  results: Record<string, CampaignLevelResult>;
  levelBadges?: string[];
}

function createEmptyProgress(): CampaignProgress {
  return { unlocked: [], results: {}, levelBadges: [] };
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function sanitizeLevelResult(raw: unknown): CampaignLevelResult | null {
  if (!raw || typeof raw !== 'object') return null;
  const source = raw as Partial<CampaignLevelResult>;
  const stars = isFiniteNumber(source.stars) ? Math.max(0, Math.min(3, Math.round(source.stars))) : 0;
  const completed = source.completed === true;
  const bestTimeSeconds = isFiniteNumber(source.bestTimeSeconds) ? Math.max(0, source.bestTimeSeconds) : null;
  const challengeVariantUnlocked = source.challengeVariantUnlocked === true;
  return { completed, stars, bestTimeSeconds, challengeVariantUnlocked };
}

export class CampaignProgressStore {
  public static readonly STORAGE_KEY = 'kiro_campaign_v1';

  /**
   * Carga el progreso de la campaña. Nunca lanza: si el almacenamiento no está
   * disponible o el contenido está corrupto devuelve un progreso limpio.
   */
  public static load(): CampaignProgress {
    try {
      const raw = localStorage.getItem(CampaignProgressStore.STORAGE_KEY);
      if (!raw) return createEmptyProgress();

      const parsed: unknown = JSON.parse(raw);
      if (!parsed || typeof parsed !== 'object') return createEmptyProgress();

      const source = parsed as Partial<CampaignProgress>;
      const progress = createEmptyProgress();

      if (Array.isArray(source.unlocked)) {
        for (const id of source.unlocked) {
          if (typeof id === 'string' && id.length > 0 && !progress.unlocked.includes(id)) {
            progress.unlocked.push(id);
          }
        }
      }

      if (source.results && typeof source.results === 'object') {
        for (const [id, value] of Object.entries(source.results)) {
          const result = sanitizeLevelResult(value);
          if (result) progress.results[id] = result;
        }
      }

      return progress;
    } catch (error) {
      console.warn('No se pudo cargar el progreso de la campaña:', error);
      return createEmptyProgress();
    }
  }

  /** Guarda el progreso. Nunca lanza. */
  public static save(progress: CampaignProgress): void {
    try {
      localStorage.setItem(CampaignProgressStore.STORAGE_KEY, JSON.stringify(progress));
    } catch (error) {
      console.warn('No se pudo guardar el progreso de la campaña:', error);
    }
  }

  /**
   * El primer nivel del orden siempre está desbloqueado. Un nivel se desbloquea
   * cuando el anterior está completado o cuando aparece en `unlocked`.
   */
  public static isUnlocked(progress: CampaignProgress, levelId: string, order: string[]): boolean {
    const index = order.indexOf(levelId);
    if (index < 0) return false;
    if (index === 0) return true;
    if (progress.unlocked.includes(levelId)) return true;

    const previousId = order[index - 1];
    return progress.results[previousId]?.completed === true;
  }

  /**
   * Registra el resultado de un nivel: conserva el mejor tiempo (el más bajo) y
   * el máximo de estrellas, y devuelve un progreso nuevo.
   */
  public static recordResult(
    progress: CampaignProgress,
    levelId: string,
    stars: number,
    timeSeconds: number,
  ): { progress: CampaignProgress; isNewBest: boolean } {
    const safeStars = Math.max(0, Math.min(3, Math.round(stars)));
    const safeTime = Math.max(0, timeSeconds);
    const previous = progress.results[levelId];
    const previousBest = previous?.bestTimeSeconds ?? null;
    const isNewBest = previousBest === null || safeTime < previousBest;
    const challengeVariantUnlocked =
      previous?.challengeVariantUnlocked === true || safeStars >= 3;

    const next: CampaignProgress = {
      unlocked: [...progress.unlocked],
      levelBadges: [...(progress.levelBadges || [])],
      results: {
        ...progress.results,
        [levelId]: {
          completed: true,
          stars: Math.max(previous?.stars ?? 0, safeStars),
          bestTimeSeconds: isNewBest ? safeTime : previousBest,
          challengeVariantUnlocked,
        },
      },
    };

    return { progress: next, isNewBest };
  }

  public static addLevelBadge(progress: CampaignProgress, badgeId: string): CampaignProgress {
    const badges = progress.levelBadges || [];
    if (!badges.includes(badgeId)) {
      return {
        ...progress,
        levelBadges: [...badges, badgeId]
      };
    }
    return progress;
  }

  public static hasLevelBadge(progress: CampaignProgress, badgeId: string): boolean {
    return (progress.levelBadges || []).includes(badgeId);
  }

  /** Borra todo el progreso de la campaña. */
  public static reset(): void {
    try {
      localStorage.removeItem(CampaignProgressStore.STORAGE_KEY);
    } catch (error) {
      console.warn('No se pudo borrar el progreso de la campaña:', error);
    }
  }
}
