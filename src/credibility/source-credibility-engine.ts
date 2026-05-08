export type SourceId = string;

export interface SourceMetadata {
  sourceId: SourceId;
  baseTrustScore: number;
  lastSeenTimestamp: number;
  historicalConflictRate: number;
  consistencyScore: number;
}

export class SourceCredibilityEngine {
  private readonly RECENCY_DECAY_FACTOR: number;
  private readonly CONFLICT_PENALTY_FACTOR: number;
  private readonly CONSISTENCY_WEIGHT: number;

  constructor(
    recencyDecayFactor: number = 0.0001,
    conflictPenaltyFactor: number = 0.1,
    consistencyWeight: number = 0.3
  ) {
    this.RECENCY_DECAY_FACTOR = recencyDecayFactor;
    this.CONFLICT_PENALTY_FACTOR = conflictPenaltyFactor;
    this.CONSISTENCY_WEIGHT = consistencyWeight;
  }

  private calculateRecencyPenalty(lastSeenTimestamp: number): number {
    const now = Date.now();
    const timeDifference = now - lastSeenTimestamp;
    // Exponential decay: 1.0 - (timeDifference * factor)
    // We ensure the score doesn't drop below 0.
    return Math.max(0.0, 1.0 - (timeDifference * this.RECENCY_DECAY_FACTOR));
  }

  private calculateConflictPenalty(conflictRate: number): number {
    // Penalty increases non-linearly with conflict rate
    return 1.0 - (conflictRate * this.CONFLICT_PENALTY_FACTOR);
  }

  public calculateScore(metadata: SourceMetadata): number {
    const {
      baseTrustScore,
      lastSeenTimestamp,
      historicalConflictRate,
      consistencyScore,
    } = metadata;

    // 1. Recency Decay (Weight 0.3)
    const recencyScore = this.calculateRecencyPenalty(lastSeenTimestamp);

    // 2. Conflict Penalty (Weight 0.4)
    const conflictScore = this.calculateConflictPenalty(historicalConflictRate);

    // 3. Consistency Boost (Weight 0.3)
    // Consistency score is assumed to be normalized (0.0 to 1.0)
    const consistencyBoost = consistencyScore;

    // Weighted average calculation
    const weightedScore = (
      baseTrustScore * 0.2
    ) + (
      recencyScore * 0.3
    ) + (
      conflictScore * 0.4
    ) + (
      consistencyBoost * this.CONSISTENCY_WEIGHT
    );

    // Normalize and clamp the final score between 0.0 and 1.0
    return Math.min(1.0, Math.max(0.0, weightedScore));
  }

  public getCredibilityScore(metadata: SourceMetadata): number {
    return this.calculateScore(metadata);
  }
}

export { SourceCredibilityEngine };