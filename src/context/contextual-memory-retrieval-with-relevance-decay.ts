import { Message, ContentBlock, TextBlock, ToolUseBlock, ThinkingBlock } from "./types";

export interface DecayRule {
  /**
   * Calculates the decay factor for a given time difference.
   * @param timeDifferenceMs The time elapsed since the memory was created, in milliseconds.
   * @returns A decay factor between 0.0 and 1.0.
   */
  calculateFactor(timeDifferenceMs: number): number;
}

export class RelevanceDecayCalculator {
  private readonly decayRule: DecayRule;

  constructor(decayRule: DecayRule) {
    this.decayRule = decayRule;
  }

  /**
   * Applies the decay factor to an initial relevance score.
   * @param initialScore The raw similarity score (e.g., cosine similarity).
   * @param timeDifferenceMs The time elapsed since the memory was created.
   * @returns The decayed relevance score.
   */
  calculateDecayedScore(initialScore: number, timeDifferenceMs: number): number {
    const decayFactor = this.decayRule.calculateFactor(timeDifferenceMs);
    return initialScore * decayFactor;
  }
}

export interface MemoryChunk {
  content: string;
  metadata: {
    timestamp: number;
    source: string;
  };
  initialScore: number;
}

export interface RetrievedContext {
  chunk: MemoryChunk;
  finalScore: number;
}

export class ContextualMemoryRetriever {
  private readonly decayCalculator: RelevanceDecayCalculator;
  private readonly vectorSearcher: {
    search(query: string, topK: number): Promise<MemoryChunk[]>;
  };

  constructor(vectorSearcher: {
    search(query: string, topK: number): Promise<MemoryChunk[]>;
  }, decayRule: DecayRule) {
    this.vectorSearcher = vectorSearcher;
    this.decayCalculator = new RelevanceDecayCalculator(decayRule);
  }

  /**
   * Retrieves, decays, and re-ranks memory chunks based on temporal relevance.
   * @param query The user query to search against the memory store.
   * @param topK The number of initial candidates to retrieve.
   * @returns A promise resolving to an array of context chunks, sorted by final relevance score.
   */
  public async retrieveContext(query: string, topK: number = 5): Promise<RetrievedContext[]> {
    const initialChunks = await this.vectorSearcher.search(query, topK);

    const currentTime = Date.now();

    const scoredContext: RetrievedContext[] = initialChunks.map(chunk => {
      const timeDifferenceMs = currentTime - chunk.metadata.timestamp;
      const decayedScore = this.decayCalculator.calculateDecayedScore(
        chunk.initialScore,
        timeDifferenceMs
      );
      return {
        chunk: chunk,
        finalScore: decayedScore,
      };
    });

    scoredContext.sort((a, b) => b.finalScore - a.finalScore);

    return scoredContext;
  }
}

export class ExponentialDecayRule implements DecayRule {
  private readonly decayRate: number;

  constructor(decayRate: number) {
    this.decayRate = decayRate;
  }

  calculateFactor(timeDifferenceMs: number): number {
    // Formula: e^(-rate * time)
    return Math.exp(-this.decayRate * (timeDifferenceMs / 1000));
  }
}