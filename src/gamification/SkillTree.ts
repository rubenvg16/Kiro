import { Skill, SkillBranch, SkillEffect, SKILL_DEFINITIONS } from './SkillDefinitions';
import { ProgressionManager } from './ProgressionManager';
import { SaveSystem } from '../storage/SaveSystem';

export interface SkillTreeState {
  unlockedSkillIds: string[];
  availablePoints: number;
  spentPoints: number;
}

export class SkillTree {
  private static instance: SkillTree | null = null;
  private unlockedSkillIds: Set<string> = new Set();

  private constructor() {
    this.hydrateFromStorage();
  }

  public static getInstance(): SkillTree {
    if (!SkillTree.instance) {
      SkillTree.instance = new SkillTree();
    }
    return SkillTree.instance;
  }

  public static resetInstance(): void {
    SkillTree.instance = null;
  }

  private hydrateFromStorage(): void {
    try {
      const save = SaveSystem.getInstance().load();
      if (save && save.skillTree && Array.isArray(save.skillTree.unlockedSkillIds)) {
        this.unlockedSkillIds = new Set(save.skillTree.unlockedSkillIds);
      }
    } catch {
      this.unlockedSkillIds = new Set();
    }
  }

  public getSkill(skillId: string): Skill | undefined {
    return SKILL_DEFINITIONS.find((s) => s.id === skillId);
  }

  public getAllSkills(): Skill[] {
    return [...SKILL_DEFINITIONS];
  }

  public getSkillsByBranch(branch: SkillBranch): Skill[] {
    return SKILL_DEFINITIONS.filter((s) => s.branch === branch);
  }

  public isUnlocked(skillId: string): boolean {
    return this.unlockedSkillIds.has(skillId);
  }

  public getUnlockedSkillIds(): string[] {
    return Array.from(this.unlockedSkillIds);
  }

  /**
   * Enforces prerequisite DAG:
   * 1. Skill is not already unlocked.
   * 2. Player has enough skill points (cost is 1).
   * 3. For depth N >= 2, at least one skill in the same branch at depth N - 1 must be unlocked.
   */
  public canPurchase(skillId: string): boolean {
    const skill = this.getSkill(skillId);
    if (!skill) return false;

    // Already owned
    if (this.unlockedSkillIds.has(skillId)) return false;

    // Check points
    const points = ProgressionManager.getInstance().getSkillPoints();
    if (points < skill.cost) return false;

    // Depth 1 has no prerequisites
    if (skill.depth === 1) return true;

    // Depth N >= 2 requires at least one unlocked skill at depth N - 1 in the same branch
    const hasBranchPrerequisite = SKILL_DEFINITIONS.some(
      (s) => s.branch === skill.branch && s.depth === skill.depth - 1 && this.unlockedSkillIds.has(s.id)
    );

    return hasBranchPrerequisite;
  }

  /**
   * Purchases a skill:
   * Deducts 1 skill point, adds skill to unlocked set, applies effect immediately,
   * and persists via SaveSystem.
   */
  public purchase(skillId: string): boolean {
    if (!this.canPurchase(skillId)) return false;

    const skill = this.getSkill(skillId)!;
    const spent = ProgressionManager.getInstance().spendSkillPoints(skill.cost);
    if (!spent) return false;

    this.unlockedSkillIds.add(skillId);
    this.persist();
    return true;
  }

  public getActiveEffects(): SkillEffect[] {
    return SKILL_DEFINITIONS.filter((s) => this.unlockedSkillIds.has(s.id)).map((s) => s.effect);
  }

  public getEffectValue(effectType: string, defaultValue: number = 1.0): number {
    const matching = this.getActiveEffects().filter((e) => e.type === effectType);
    if (matching.length === 0) return defaultValue;

    // If multiplier, multiply together; if absolute/flag, return max
    if (effectType.endsWith('Mult')) {
      return matching.reduce((acc, curr) => acc * curr.value, 1.0);
    }
    return Math.max(...matching.map((e) => e.value));
  }

  public serialize(): SkillTreeState {
    const points = ProgressionManager.getInstance().getSkillPoints();
    return {
      unlockedSkillIds: Array.from(this.unlockedSkillIds),
      availablePoints: points,
      spentPoints: this.unlockedSkillIds.size
    };
  }

  public hydrate(state: Partial<SkillTreeState>): void {
    if (state.unlockedSkillIds && Array.isArray(state.unlockedSkillIds)) {
      this.unlockedSkillIds = new Set(state.unlockedSkillIds);
    }
    this.persist();
  }

  public clearUnlockedSkills(): void {
    this.unlockedSkillIds.clear();
    this.persist();
  }

  private persist(): void {
    try {
      SaveSystem.getInstance().save({
        skillTree: this.serialize()
      });
    } catch {
      // Safe fallback
    }
  }
}
