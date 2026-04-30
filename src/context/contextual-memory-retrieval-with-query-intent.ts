import { Message, ContentBlock, TextBlock, ToolUseBlock, ThinkingBlock } from "./types";

export interface ContextEntry {
  id: string;
  timestamp: number;
  content_vector: Float32Array;
  intent_vector?: Float32Array;
  source_message: Message;
}

export interface QueryIntent {
  query_vector: Float32Array;
  intent_vector: Float32Array;
}

export interface RetrievalScore {
  context_id: string;
  score: number;
}

export class ContextualMemoryRetriever {
  private memories: ContextEntry[];
  private contentWeight: number;
  private intentWeight: number;
  private decayRate: number;

  constructor(
    memories: ContextEntry[],
    contentWeight: number = 0.6,
    intentWeight: number = 0.4,
    decayRate: number = 0.01
  ) {
    this.memories = memories;
    this.contentWeight = contentWeight;
    this.intentWeight = intentWeight;
    this.decayRate = decayRate;
  }

  private calculateCosineSimilarity(vecA: Float32Array, vecB: Float32Array): number {
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    for (let i = 0; i < vecA.length; i++) {
      dotProduct += vecA[i] * vecB[i];
      normA += vecA[i] * vecA[i];
      normB += vecB[i] * vecB[i];
    }
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  private calculateTemporalDecay(timestamp: number): number {
    const currentTime = Date.now();
    const age = currentTime - timestamp;
    return Math.exp(-this.decayRate * age);
  }

  private calculateWeightedScore(
    entry: ContextEntry,
    queryIntent: QueryIntent
  ): number {
    const contentSimilarity = this.calculateCosineSimilarity(
      entry.content_vector,
      queryIntent.query_vector
    );

    let intentSimilarity = 0;
    if (entry.intent_vector) {
      intentSimilarity = this.calculateCosineSimilarity(
        entry.intent_vector,
        queryIntent.intent_vector
      );
    }

    const temporalScore = this.calculateTemporalDecay(entry.timestamp);

    const weightedScore = (
      this.contentWeight * contentSimilarity +
      this.intentWeight * intentSimilarity
    ) * temporalScore;

    return weightedScore;
  }

  public retrieve(queryIntent: QueryIntent): RetrievalScore[] {
    const scores: RetrievalScore[] = this.memories.map((entry) => {
      const score = this.calculateWeightedScore(entry, queryIntent);
      return {
        context_id: entry.id,
        score: score,
      };
    });

    return scores.sort((a, b) => b.score - a.score);
  }
}