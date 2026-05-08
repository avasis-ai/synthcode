import { Message, ContentBlock, TextBlock, ToolUseBlock, ThinkingBlock } from "./types";

export interface SourceMetadata {
  sourceName: string;
  lastUpdatedTimestamp: number; // Unix timestamp in milliseconds
  dataVolumeBytes: number;
}

export type DecayFunction = (ageHours: number, maxAgeHours: number) => number;

export interface StalenessPolicy {
  maxAgeHours: number;
  decayFunction: DecayFunction;
  minAcceptableScore: number;
}

export interface FreshnessScore {
  score: number;
  isFresh: boolean;
  reason: string;
}

class DataFreshnessGate {
  private policy: StalenessPolicy;

  constructor(policy: StalenessPolicy) {
    this.policy = policy;
  }

  private calculateAgeHours(metadata: SourceMetadata): number {
    const now = Date.now();
    const ageMs = now - metadata.lastUpdatedTimestamp;
    return ageMs / (1000 * 60 * 60);
  }

  private calculateScore(metadata: SourceMetadata, ageHours: number): number {
    const { decayFunction } = this.policy;
    
    // Use the decay function to determine the base score based on age
    let score = decayFunction(ageHours, this.policy.maxAgeHours);

    // Optionally, incorporate data volume or source reliability into the score
    const volumeFactor = Math.min(1.0, Math.log(metadata.dataVolumeBytes + 1) / 10);
    score = Math.min(1.0, score * volumeFactor);

    return score;
  }

  public checkFreshness(metadata: SourceMetadata): FreshnessScore {
    const ageHours = this.calculateAgeHours(metadata);
    const score = this.calculateScore(metadata, ageHours);
    const isFresh = score >= this.policy.minAcceptableScore;

    let reason = `Data is ${ageHours.toFixed(2)} hours old. Score: ${score.toFixed(2)}. `;
    if (isFresh) {
      reason += "Status: Acceptable.";
    } else {
      reason += "Status: Stale. Requires re-query or fallback.";
    }

    return {
      score: score,
      isFresh: isFresh,
      reason: reason,
    };
  }
}

export { DataFreshnessGate };