import { Message, ContentBlock, TextBlock, ToolUseBlock, ThinkingBlock } from "./types";

export interface DecayRule {
  baseDecayFactor: number;
  timeWeightMultiplier: number;
}

export interface MemoryChunk {
  id: string;
  content: string;
  timestamp: number;
  metadata: Record<string, unknown>;
}

export class ContextualMemoryRetrieverV3 {
  private decayRule: DecayRule;

  constructor(decayRule: DecayRule) {
    this.decayRule = decayRule;
  }

  private calculateDecayBoost(timestamp: number): number {
    const timeSinceAccess = Date.now() - timestamp;
    return this.decayRule.baseDecayFactor * this.decayRule.timeWeightMultiplier * (1 / (1 + timeSinceAccess / 10000));
  }

  private calculateWeightedScore(semanticSimilarity: number, timestamp: number): number {
    const decayBoost = this.calculateDecayBoost(timestamp);
    return semanticSimilarity * (1 + decayBoost);
  }

  public async retrieve(
    query: string,
    memoryChunks: MemoryChunk[],
    semanticSimilarityFunction: (query: string, chunk: MemoryChunk) => Promise<number>
  ): Promise<{ chunk: MemoryChunk; score: number }[]> {
    const scoredResults: { chunk: MemoryChunk; score: number }[] = [];

    for (const chunk of memoryChunks) {
      const semanticSimilarity = await semanticSimilarityFunction(query, chunk);
      const weightedScore = this.calculateWeightedScore(semanticSimilarity, chunk.timestamp);
      scoredResults.push({ chunk, score: weightedScore });
    }

    scoredResults.sort((a, b) => b.score - a.score);

    return scoredResults;
  }
}