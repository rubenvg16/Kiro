import { describe, it, expect, beforeEach } from 'vitest';
import { LEVELS } from '../../levels/levels/index';
import { CampaignProgressStore } from '../../gamification/CampaignProgress';
import type { CampaignProgress } from '../CampaignProgress';

describe('Level Campaign 15 Levels & Progression', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('contains exactly 15 unique campaign levels across 3 difficulty tiers', () => {
    expect(LEVELS.length).toBe(15);
    const ids = LEVELS.map((l) => l.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(15);

    const explorador = LEVELS.filter((l) => l.tier === 'explorador');
    const investigador = LEVELS.filter((l) => l.tier === 'investigador');
    const maestro = LEVELS.filter((l) => l.tier === 'maestro');

    expect(explorador.length).toBe(5);
    expect(investigador.length).toBe(5);
    expect(maestro.length).toBe(5);
  });

  it('unlocks challenge variant and level badge on 3-star completion', () => {
    let progress: CampaignProgress = CampaignProgressStore.load();
    const levelId = LEVELS[0].id;

    // Initially locked challenge variant
    expect(progress.results[levelId]?.challengeVariantUnlocked).toBeFalsy();
    expect(CampaignProgressStore.hasLevelBadge(progress, `badge_${levelId}`)).toBe(false);

    // 3 stars completion
    const record = CampaignProgressStore.recordResult(progress, levelId, 3, 25);
    progress = record.progress;
    progress = CampaignProgressStore.addLevelBadge(progress, `badge_${levelId}`);

    expect(progress.results[levelId].stars).toBe(3);
    expect(progress.results[levelId].challengeVariantUnlocked).toBe(true);
    expect(CampaignProgressStore.hasLevelBadge(progress, `badge_${levelId}`)).toBe(true);
  });

  it('sequential unlock works throughout all 15 levels', () => {
    const order = LEVELS.map((l) => l.id);
    let progress = CampaignProgressStore.load();

    // First level is unlocked by default
    expect(CampaignProgressStore.isUnlocked(progress, order[0], order)).toBe(true);
    // Second level is locked
    expect(CampaignProgressStore.isUnlocked(progress, order[1], order)).toBe(false);

    // Complete level 0 -> level 1 unlocks
    progress = CampaignProgressStore.recordResult(progress, order[0], 2, 45).progress;
    expect(CampaignProgressStore.isUnlocked(progress, order[1], order)).toBe(true);
  });
});
