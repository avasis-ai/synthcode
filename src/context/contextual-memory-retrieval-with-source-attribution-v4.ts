import {
  Message,
  UserMessage,
  AssistantMessage,
  ToolResultMessage,
  ContentBlock,
  TextBlock,
  ToolUseBlock,
  ThinkingBlock,
} from "./types";

interface SourceProvenance {
  sourceId: string;
  confidenceScore: number;
  timestamp: number;
}

export interface AttributedContextChunk {
  content: string;
  sourceProvenance: SourceProvenance;
  relevanceScore: number;
}

interface ContextChunk {
  content: string;
  sourceProvenance: SourceProvenance;
}

export class AttributionScorer {
  private readonly semanticWeight: number;
  private readonly confidenceWeight: number;
  private readonly recencyWeight: number;

  constructor(
    semanticWeight: number = 0.4,
    confidenceWeight: number = 0.4,
    recencyWeight: number = 0.2,
  ) {
    this.semanticWeight = semanticWeight;
    this.confidenceWeight = confidenceWeight;
    this.recencyWeight = recencyWeight;
  }

  calculateScore(
    chunk: AttributedContextChunk,
    query: string,
    currentTime: number
  ): number {
    const semanticSimilarity = this.calculateSemanticSimilarity(chunk.content, query);
    const confidence = chunk.sourceProvenance.confidenceScore;
    const recencyFactor = this.calculateRecencyFactor(chunk.sourceProvenance.timestamp, currentTime);

    const finalScore = (
      semanticSimilarity * this.semanticWeight +
      confidence * this.confidenceWeight +
      recencyFactor * this.recencyWeight
    );
    return finalScore;
  }

  private calculateSemanticSimilarity(content: string, query: string): number {
    // Placeholder for actual embedding/similarity calculation (e.g., cosine similarity)
    // For simulation, we use a simple length-based heuristic.
    const baseSimilarity = Math.min(
      1.0,
      (content.length + query.length) / (2 * 100)
    );
    return baseSimilarity;
  }

  private calculateRecencyFactor(timestamp: number, currentTime: number): number {
    // Exponential decay function for recency: closer to 1.0 for recent, closer to 0.0 for old.
    const timeDifference = currentTime - timestamp;
    const decayRate = 0.0001;
    return Math.exp(-timeDifference * decayRate);
  }
}

export class ContextualMemoryRetriever {
  private scorer: AttributionScorer;

  constructor(scorer: AttributionScorer) {
    this.scorer = scorer;
  }

  retrieve(
    query: string,
    memoryStore: AttributedContextChunk[],
    currentTime: number = Date.now()
  ): AttributedContextChunk[] {
    if (!memoryStore || memoryStore.length === 0) {
      return [];
    }

    const scoredChunks = memoryStore.map((chunk) => {
      const score = this.scorer.calculateScore(chunk, query, currentTime);
      return { ...chunk, relevanceScore: score };
    });

    // Sort by relevance score descending
    scoredChunks.sort((a, b) => b.relevanceScore - a.relevanceScore);

    // Return top N chunks (e.g., top 5)
    return scoredChunks.slice(0, 5);
  }
}