import { Message, ContentBlock, TextBlock, ToolUseBlock, ThinkingBlock } from "./types";

export interface ContextChunk {
  id: string;
  source: string;
  content: string;
  embedding: Float32Array;
}

export interface MergeConfig {
  topK: number;
  similarityThreshold: number;
  sourceWeights: Record<string, number>;
}

export class SemanticContextMerger {
  private config: MergeConfig;

  constructor(config: MergeConfig) {
    this.config = config;
  }

  private calculateSimilarity(embeddingA: Float32Array, embeddingB: Float32Array): number {
    let sumOfSquares = 0;
    for (let i = 0; i < embeddingA.length; i++) {
      sumOfSquares += (embeddingA[i] - embeddingB[i]) ** 2;
    }
    return 1 - Math.sqrt(sumOfSquares) / Math.sqrt(embeddingA.length);
  }

  private calculateNoveltyScore(chunk: ContextChunk, existingChunkIds: Set<string>): number {
    if (existingChunkIds.has(chunk.id)) {
      return 0;
    }
    return 1.0;
  }

  private calculateRelevanceScore(chunk: ContextChunk, allChunks: ContextChunk[]): number {
    let totalSimilarity = 0;
    let count = 0;
    for (const otherChunk of allChunks) {
      if (chunk.id === otherChunk.id) continue;
      const similarity = this.calculateSimilarity(chunk.embedding, otherChunk.embedding);
      totalSimilarity += similarity;
      count++;
    }
    return count > 0 ? totalSimilarity / count : 0;
  }

  public merge(chunks: ContextChunk[]): ContextChunk[] {
    if (!chunks || chunks.length === 0) {
      return [];
    }

    const { topK, similarityThreshold, sourceWeights } = this.config;

    const scoredChunks: { chunk: ContextChunk; score: number }[] = [];

    for (const chunk of chunks) {
      const novelty = this.calculateNoveltyScore(chunk, new Set<string>());
      const relevance = this.calculateRelevanceScore(chunk, chunks);
      const sourceWeight = sourceWeights[chunk.source] || 1.0;

      // Simple composite score: Novelty * Relevance * SourceWeight
      const score = novelty * relevance * sourceWeight;
      scoredChunks.push({ chunk, score });
    }

    // Sort by score descending
    scoredChunks.sort((a, b) => b.score - a.score);

    // Filter for uniqueness and threshold
    const uniqueChunksMap = new Map<string, ContextChunk>();
    const finalCandidates: ContextChunk[] = [];

    for (const { chunk, score } of scoredChunks) {
      if (score < 0.1) continue; // Basic filtering
      if (!uniqueChunksMap.has(chunk.id)) {
        uniqueChunksMap.set(chunk.id, chunk);
        finalCandidates.push(chunk);
      }
    }

    // Select top K
    return finalCandidates.slice(0, topK);
  }
}