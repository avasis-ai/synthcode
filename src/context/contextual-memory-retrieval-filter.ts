import { Message, ContentBlock, TextBlock, ToolUseBlock, ThinkingBlock } from "./types";

export interface TemporalConstraint {
  sourceMessageId: string;
  targetChunkId: string;
  minTimeDeltaSeconds: number;
  dependencyType: "precedes" | "follows" | "related_to";
}

export interface ContextualMemoryRetriever {
  retrieve(
    query: string,
    history: Message[],
    constraints: TemporalConstraint[]
  ): {
    filteredChunks: { id: string; content: string }[];
    score: number;
  };
}

export class ContextualMemoryRetrieverImpl implements ContextualMemoryRetriever {
  private readonly mockContextStore: Map<string, { content: string; timestamp: number }>;

  constructor() {
    this.mockContextStore = new Map<string, { content: string; timestamp: number>>();
    // Initialize with some mock data for demonstration
    this.mockContextStore.set("chunk_1", { content: "Initial context chunk A.", timestamp: Date.now() - 10000 });
    this.mockContextStore.set("chunk_2", { content: "Recent event details B.", timestamp: Date.now() - 5000 });
    this.mockContextStore.set("chunk_3", { content: "Old background info C.", timestamp: Date.now() - 60000 });
  }

  private calculateTemporalScore(chunk: { id: string; content: string }, constraints: TemporalConstraint[]): number {
    let score = 0;
    for (const constraint of constraints) {
      if (constraint.targetChunkId === chunk.id) {
        const source = this.mockContextStore.get(constraint.sourceMessageId);
        if (source) {
          const timeDelta = Math.abs(source.timestamp - (Date.now() - 1000)); // Mock current time reference
          if (constraint.dependencyType === "precedes" && timeDelta < constraint.minTimeDeltaSeconds) {
            score += 0.3;
          } else if (constraint.dependencyType === "follows" && timeDelta > constraint.minTimeDeltaSeconds) {
            score += 0.3;
          } else if (constraint.dependencyType === "related_to" && timeDelta > 1000) {
            score += 0.2;
          }
        }
      }
    }
    return score;
  }

  private calculateDependencyScore(chunk: { id: string; content: string }, constraints: TemporalConstraint[]): number {
    let score = 0;
    for (const constraint of constraints) {
      if (constraint.targetChunkId === chunk.id) {
        // Simple dependency check: if the chunk is explicitly constrained, it gets a boost.
        score += 0.1;
      }
    }
    return score;
  }

  public retrieve(
    query: string,
    history: Message[],
    constraints: TemporalConstraint[]
  ): {
    filteredChunks: { id: string; content: string }[];
    score: number;
  } {
    const allChunks = Array.from(this.mockContextStore.entries()).map(([id, data]) => ({
      id: id,
      content: data.content
    }));

    let totalScore = 0;
    const scoredChunks: { chunk: { id: string; content: string }; score: number }[] = [];

    for (const chunk of allChunks) {
      let currentScore = 0;
      // 1. Base Semantic Score (Mocked)
      const semanticScore = query.length > 10 && chunk.content.includes("context") ? 0.5 : 0.1;

      // 2. Temporal Scoring
      const temporalScore = this.calculateTemporalScore(chunk, constraints);

      // 3. Dependency Scoring
      const dependencyScore = this.calculateDependencyScore(chunk, constraints);

      currentScore = semanticScore + temporalScore + dependencyScore;
      totalScore += currentScore;
      scoredChunks.push({ chunk: chunk, score: currentScore });
    }

    // Filter and sort based on score (and implicitly by constraints satisfaction)
    const filteredChunks = scoredChunks
      .sort((a, b) => b.score - a.score)
      .map(item => item.chunk);

    return {
      filteredChunks: filteredChunks,
      score: totalScore,
    };
  }
}

export const createContextualMemoryRetriever = (): ContextualMemoryRetriever => {
  return new ContextualMemoryRetrieverImpl();
};