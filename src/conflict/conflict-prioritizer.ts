export type ConflictType = "GOAL" | "RESOURCE" | "CAPABILITY" | string;

export interface Conflict {
  type: ConflictType;
  severity: number;
  source: string;
}

export type WeightMap = Record<ConflictType, number>;

export class ConflictPrioritizer {
  constructor() {}

  /**
   * Calculates the weighted score for a single conflict.
   * @param conflict The conflict object.
   * @param weights The map of weights for different conflict types.
   * @returns The weighted score.
   */
  private calculateScore(conflict: Conflict, weights: WeightMap): number {
    const weight = weights[conflict.type] || 1.0;
    return conflict.severity * weight;
  }

  /**
   * Analyzes multiple conflicts and determines the most critical one based on weighted scores.
   * @param conflicts An array of detected conflicts.
   * @param weights A map defining the priority weight for each conflict type.
   * @returns The conflict with the highest weighted score.
   * @throws Error if no conflicts are provided.
   */
  public getHighestPriorityConflict(conflicts: Conflict[], weights: WeightMap): Conflict {
    if (!conflicts || conflicts.length === 0) {
      throw new Error("Cannot prioritize conflicts: The conflict list is empty.");
    }

    const scoredConflicts = conflicts.map(conflict => ({
      conflict: conflict,
      score: this.calculateScore(conflict, weights),
    }));

    return scoredConflicts.reduce((best, current) => {
      return current.score > best.score ? current : best;
    }, scoredConflicts[0]).conflict;
  }

  /**
   * Analyzes multiple conflicts and returns a prioritized list of conflicts.
   * @param conflicts An array of detected conflicts.
   * @param weights A map defining the priority weight for each conflict type.
   * @returns An array of conflicts sorted from highest priority to lowest.
   */
  public getPrioritizedConflictList(conflicts: Conflict[], weights: WeightMap): Conflict[] {
    const scoredConflicts = conflicts.map(conflict => ({
      conflict: conflict,
      score: this.calculateScore(conflict, weights),
    }));

    return scoredConflicts.sort((a, b) => b.score - a.score).map(item => item.conflict);
  }
}

export { ConflictPrioritizer, Conflict, WeightMap };