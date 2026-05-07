export type SourceType =
  | "context_retrieval"
  | "tool_execution"
  | "plan_step"
  | "source_authority"
  | "manual";

export interface ConfidenceScore {
  score: number;
  sourceType: SourceType;
  weight: number;
}

export class ConfidenceScoringEngine {
  /**
   * Calculates the aggregate confidence score from a list of individual scores.
   * Uses a weighted average approach: Sum(score * weight) / Sum(weight).
   * @param scores An array of confidence scores from various sources.
   * @returns The overall aggregated confidence score (0.0 to 1.0).
   */
  public calculateAggregateScore(scores: ConfidenceScore[]): number {
    if (!scores || scores.length === 0) {
      return 0.0;
    }

    let weightedSum = 0.0;
    let totalWeight = 0.0;

    for (const score of scores) {
      weightedSum += score.score * score.weight;
      totalWeight += score.weight;
    }

    if (totalWeight === 0.0) {
      return 0.0;
    }

    return weightedSum / totalWeight;
  }

  /**
   * Calculates the minimum confidence score across all provided scores.
   * Useful when the system fails if *any* component is uncertain.
   * @param scores An array of confidence scores.
   * @returns The minimum score found, or 0.0 if no scores are provided.
   */
  public calculateMinimumScore(scores: ConfidenceScore[]): number {
    if (!scores || scores.length === 0) {
      return 0.0;
    }

    let minScore = 1.0;
    for (const score of scores) {
      if (score.score < minScore) {
        minScore = score.score;
      }
    }
    return minScore;
  }
}

/**
 * Helper function to create a ConfidenceScore from a tool execution result.
 * @param confidence The measured confidence (0.0 to 1.0).
 * @param weight The importance weight of the tool result.
 * @returns A ConfidenceScore object.
 */
export function fromToolResult(confidence: number, weight: number = 0.5): ConfidenceScore {
  return {
    score: Math.max(0.0, Math.min(1.0, confidence)),
    sourceType: "tool_execution",
    weight: weight,
  };
}

/**
 * Helper function to create a ConfidenceScore based on source authority.
 * @param authorityScore The measured authority score (0.0 to 1.0).
 * @param weight The importance weight of the source.
 * @returns A ConfidenceScore object.
 */
export function fromSourceAuthority(authorityScore: number, weight: number = 0.3): ConfidenceScore {
  return {
    score: Math.max(0.0, Math.min(1.0, authorityScore)),
    sourceType: "source_authority",
    weight: weight,
  };
}

/**
 * Helper function to create a ConfidenceScore for context retrieval.
 * @param retrievalScore The measured confidence (0.0 to 1.0).
 * @param weight The importance weight of the context.
 * @returns A ConfidenceScore object.
 */
export function fromContextRetrieval(retrievalScore: number, weight: number = 0.4): ConfidenceScore {
  return {
    score: Math.max(0.0, Math.min(1.0, retrievalScore)),
    sourceType: "context_retrieval",
    weight: weight,
  };
}