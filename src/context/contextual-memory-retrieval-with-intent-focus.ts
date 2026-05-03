import { Message, ContentBlock, TextBlock, ToolUseBlock, ThinkingBlock } from "./types";

export type Intent = {
  primaryIntent: string;
  keywords: string[];
  focusWeight: number; // How strongly to weight intent alignment vs. general relevance
};

export interface RetrievalContext {
  history: Message[];
  currentIntent: Intent;
  memoryChunks: {
    id: string;
    content: string;
    metadata: Record<string, any>;
  }[];
}

export interface RetrievalResult {
  chunkId: string;
  relevanceScore: number;
  intentAlignmentScore: number;
  fusedScore: number;
}

export class ContextualMemoryRetriever {
  private readonly defaultFocusWeight: number;

  constructor(defaultFocusWeight: number = 0.5) {
    this.defaultFocusWeight = defaultFocusWeight;
  }

  private calculateIntentAlignmentScore(chunkContent: string, intent: Intent): number {
    const lowerContent = chunkContent.toLowerCase();
    let score = 0;

    // 1. Keyword matching score
    intent.keywords.forEach(keyword => {
      if (lowerContent.includes(keyword.toLowerCase())) {
        score += 0.2;
      }
    });

    // 2. Primary Intent semantic proxy (simplified: checking for intent keywords)
    if (intent.primaryIntent && lowerContent.includes(intent.primaryIntent.toLowerCase())) {
      score += 0.5;
    }

    return Math.min(1.0, score);
  }

  private calculateRelevanceScore(chunkContent: string, history: Message[]): number {
    // Placeholder for complex embedding similarity calculation (e.g., cosine similarity)
    // In a real system, this would compare chunk embeddings against the history/query embedding.
    // For this simulation, we use content length and a simple heuristic.
    const historyLengthFactor = history.length * 0.01;
    return Math.min(1.0, (chunkContent.length / 100.0) + historyLengthFactor);
  }

  public retrieve(context: RetrievalContext): RetrievalResult[] {
    const { history, currentIntent, memoryChunks } = context;

    if (!currentIntent) {
      console.warn("No intent provided. Falling back to standard relevance retrieval.");
      return memoryChunks.map(chunk => ({
        chunkId: chunk.id,
        relevanceScore: this.calculateRelevanceScore(chunk.content, history),
        intentAlignmentScore: 0.0,
        fusedScore: this.calculateRelevanceScore(chunk.content, history),
      }));
    }

    const results: RetrievalResult[] = memoryChunks.map(chunk => {
      const relevanceScore = this.calculateRelevanceScore(chunk.content, history);
      const intentAlignmentScore = this.calculateIntentAlignmentScore(chunk.content, currentIntent);

      // Fusion Strategy: Weighted combination
      // FusedScore = (Weight * Relevance) + ((1 - Weight) * IntentAlignment)
      const focusWeight = Math.max(0.1, Math.min(0.9, currentIntent.focusWeight));
      const fusedScore = (focusWeight * relevanceScore) + ((1 - focusWeight) * intentAlignmentScore);

      return {
        chunkId: chunk.id,
        relevanceScore: relevanceScore,
        intentAlignmentScore: intentAlignmentScore,
        fusedScore: fusedScore,
      };
    });

    // Sort by the final fused score
    results.sort((a, b) => b.fusedScore - a.fusedScore);

    return results;
  }
}