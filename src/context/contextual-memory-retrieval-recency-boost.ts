import { Message, ContentBlock, TextBlock, ToolUseBlock, ThinkingBlock } from "./types";

export type ContextChunk = {
  content: string;
  timestamp: number;
};

export interface RecencyBoostConfig {
  decayRate: number;
  initialBoost: number;
}

export class ContextualMemoryRetrievalRecencyBoost {
  private config: RecencyBoostConfig;

  constructor(config: RecencyBoostConfig) {
    this.config = config;
  }

  private calculateRecencyBoost(chunkTimestamp: number, queryTimestamp: number): number {
    const timeDifference = Math.abs(queryTimestamp - chunkTimestamp);
    const decayFactor = Math.exp(-this.config.decayRate * timeDifference);
    return this.config.initialBoost + decayFactor;
  }

  public applyBoost(
    contextChunks: ContextChunk[],
    queryTimestamp: number
  ): {
    boostedChunks: { chunk: ContextChunk; boost: number }[];
    boostedScores: number[];
  } {
    const boostedChunks: { chunk: ContextChunk; boost: number }[] = [];
    const boostedScores: number[] = [];

    for (const chunk of contextChunks) {
      const boost = this.calculateRecencyBoost(chunk.timestamp, queryTimestamp);
      boostedChunks.push({ chunk, boost });
      // Assuming the base score is calculated elsewhere and passed or derived.
      // For this implementation, we'll just store the boost factor as a placeholder score modifier.
      boostedScores.push(boost);
    }

    return {
      boostedChunks,
      boostedScores,
    };
  }

  public static calculateWeightedScore(
    baseSimilarityScore: number,
    recencyBoost: number
  ): number {
    // Weighted average: Score * (1 + Boost * Weight)
    // Here, we use a simple multiplicative boost for demonstration.
    const weight = 0.5;
    return baseSimilarityScore * (1 + recencyBoost * weight);
  }
}