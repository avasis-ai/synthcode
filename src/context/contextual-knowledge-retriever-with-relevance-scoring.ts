import { Message, ContentBlock, TextBlock, ToolUseBlock, ThinkingBlock } from "./types";

type KnowledgeChunk = {
  id: string;
  content: string;
  timestamp: number;
  embedding: Float32Array;
};

interface ScoringWeights {
  semanticWeight: number;
  temporalWeight: number;
}

export class ContextualKnowledgeRetrieverWithRelevanceScoring {
  private knowledgeBase: KnowledgeChunk[];
  private weights: ScoringWeights;

  constructor(knowledgeBase: KnowledgeChunk[], weights: ScoringWeights) {
    this.knowledgeBase = knowledgeBase;
    this.weights = weights;
  }

  private calculateCosineSimilarity(embeddingA: Float32Array, embeddingB: Float32Array): number {
    let dotProduct = 0;
    let magnitudeASquared = 0;
    let magnitudeBSquared = 0;
    const dimension = embeddingA.length;

    for (let i = 0; i < dimension; i++) {
      dotProduct += embeddingA[i] * embeddingB[i];
      magnitudeASquared += embeddingA[i] * embeddingA[i];
      magnitudeBSquared += embeddingB[i] * embeddingB[i];
    }

    const magnitudeA = Math.sqrt(magnitudeASquared);
    const magnitudeB = Math.sqrt(magnitudeBSquared);

    if (magnitudeA === 0 || magnitudeB === 0) {
      return 0;
    }

    return dotProduct / (magnitudeA * magnitudeB);
  }

  private calculateTemporalDecay(chunkTimestamp: number, currentTime: number): number {
    const timeDifference = currentTime - chunkTimestamp;
    // Simple exponential decay: e^(-k * t)
    // We use a decay constant k=0.01 for demonstration.
    const decayConstant = 0.01;
    return Math.exp(-decayConstant * timeDifference);
  }

  private scoreChunk(queryEmbedding: Float32Array, chunk: KnowledgeChunk, currentTime: number): number {
    // 1. Semantic Relevance (Cosine Similarity)
    const semanticScore = this.calculateCosineSimilarity(queryEmbedding, chunk.embedding);

    // 2. Temporal Relevance (Decay Factor)
    const temporalScore = this.calculateTemporalDecay(chunk.timestamp, currentTime);

    // 3. Composite Score
    const compositeScore = (this.weights.semanticWeight * semanticScore) +
                           (this.weights.temporalWeight * temporalScore);

    return compositeScore;
  }

  public retrieve(
    queryEmbedding: Float32Array,
    currentTime: number,
    topK: number
  ): { chunks: KnowledgeChunk[]; scores: number[] } {
    if (this.knowledgeBase.length === 0) {
      return { chunks: [], scores: [] };
    }

    const scoredResults: { chunk: KnowledgeChunk; score: number }[] = [];

    for (const chunk of this.knowledgeBase) {
      const score = this.scoreChunk(queryEmbedding, chunk, currentTime);
      scoredResults.push({ chunk: chunk, score: score });
    }

    // Sort by score in descending order
    scoredResults.sort((a, b) => b.score - a.score);

    // Select top K
    const topKResults = scoredResults.slice(0, topK);

    const chunks: KnowledgeChunk[] = topKResults.map(r => r.chunk);
    const scores: number[] = topKResults.map(r => r.score);

    return { chunks, scores };
  }
}