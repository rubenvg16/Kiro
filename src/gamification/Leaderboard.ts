import { SaveSystem, LeaderboardEntry, LeaderboardData } from '../storage/SaveSystem';

export type { LeaderboardEntry, LeaderboardData };

export class Leaderboard {
  private static instance: Leaderboard | null = null;
  private data: LeaderboardData = { byMinigame: {} };

  private constructor() {
    this.hydrateFromStorage();
  }

  public static getInstance(): Leaderboard {
    if (!Leaderboard.instance) {
      Leaderboard.instance = new Leaderboard();
    }
    return Leaderboard.instance;
  }

  public static resetInstance(): void {
    Leaderboard.instance = null;
  }

  private hydrateFromStorage(): void {
    try {
      const save = SaveSystem.getInstance().load();
      if (save && save.leaderboard && typeof save.leaderboard === 'object') {
        this.data = { byMinigame: save.leaderboard.byMinigame || {} };
      }
    } catch {
      this.data = { byMinigame: {} };
    }
  }

  /**
   * Submits a score for a minigame:
   * 1. Inserts the new entry.
   * 2. Sorts the list in descending order by score (tie-breaker: oldest timestamp first).
   * 3. Discards any entries beyond top 10.
   * 4. Persists the updated leaderboard in SaveSystem.
   * Returns true if the submitted entry made the top 10.
   */
  public submitScore(
    minigameId: string,
    score: number,
    playerName: string,
    profileId: string
  ): boolean {
    if (!this.data.byMinigame[minigameId]) {
      this.data.byMinigame[minigameId] = [];
    }

    const list = this.data.byMinigame[minigameId];
    const newEntry: LeaderboardEntry = {
      playerName: playerName.trim() || 'Estudiante',
      profileId,
      score,
      timestamp: Date.now()
    };

    list.push(newEntry);
    list.sort((a, b) => b.score - a.score || a.timestamp - b.timestamp);

    const madeTop10 = list.slice(0, 10).includes(newEntry);

    if (list.length > 10) {
      this.data.byMinigame[minigameId] = list.slice(0, 10);
    }

    this.persist();
    return madeTop10;
  }

  /**
   * Returns the top 10 entries for a given minigame sorted descending by score.
   */
  public getTop10(minigameId: string): LeaderboardEntry[] {
    const list = this.data.byMinigame[minigameId] || [];
    return [...list];
  }

  public serialize(): LeaderboardData {
    return {
      byMinigame: { ...this.data.byMinigame }
    };
  }

  public hydrate(data: Partial<LeaderboardData>): void {
    if (data && data.byMinigame) {
      this.data = { byMinigame: { ...data.byMinigame } };
    }
    this.persist();
  }

  public clear(): void {
    this.data = { byMinigame: {} };
    this.persist();
  }

  private persist(): void {
    try {
      SaveSystem.getInstance().save({
        leaderboard: this.serialize()
      });
    } catch {
      // Safe fallback
    }
  }
}
