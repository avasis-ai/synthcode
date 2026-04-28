import { TextBlock, ContentBlock, Message } from "./types";

export type ContextChunk = {
  text: string;
  metadata: Record<string, any>;
};

export class SemanticContextMerger {
  private relevanceFactor: number;

  constructor(relevanceFactor: number = 0.5) {
    this.relevanceFactor = relevanceFactor;
  }

  private calculateSimilarity(chunkA: ContextChunk, chunkB: ContextChunk): number {
    const textA = chunkA.text.toLowerCase();
    const textB = chunkB.text.toLowerCase();

    if (!textA || !textB) return 0;

    const wordsA = textA.split(/\s+/).filter(w => w.length > 0);
    const wordsB = textB.split(/\s+/).filter(w => w.length > 0);

    if (wordsA.length === 0 || wordsB.length === 0) return 0;

    const setA = new Set(wordsA);
    const setB = new Set(wordsB);

    let intersection = 0;
    for (const word of setA) {
      if (setB.has(word)) {
        intersection++;
      }
    }

    const unionSize = setA.size + setB.size - intersection;
    return Math.min(1.0, intersection / Math.max(setA.size, setB.size) * 1.5);
  }

  private calculateWeightedScore(chunk: ContextChunk, allChunks: ContextChunk[]): number {
    let totalScore = 0;
    let count = 0;

    for (const otherChunk of allChunks) {
      if (chunk === otherChunk) continue;

      const similarity = this.calculateSimilarity(chunk, otherChunk);
      // Simple weighted score: similarity * (1 + relevanceFactor * (1 - similarity))
      // This boosts the score for highly similar items, but also rewards moderate similarity
      const weightedSimilarity = similarity * (1 + this.relevanceFactor * (1 - similarity));
      totalScore += weightedSimilarity;
      count++;
    }

    return count > 0 ? totalScore / count : 0;
  }

  public merge(chunks: ContextChunk[]): Context[] {
    if (!chunks || chunks.length === 0) {
      return [];
    }

    const scoredChunks: { chunk: ContextChunk; score: number }[] = [];

    for (const chunk of chunks) {
      const score = this.calculateWeightedScore(chunk, chunks);
      scoredChunks.push({ chunk, score });
    }

    // Sort by score descending
    scoredChunks.sort((a, b) => b.score - a.score);

    const mergedContext: Context[] = [];
    const uniqueChunks: Set<ContextChunk> = new Set();

    for (const { chunk, score } of scoredChunks) {
      // Simple deduplication based on content hash or reference equality for this implementation
      if (!uniqueChunks.has(chunk)) {
        // In a real scenario, we would use the score to blend content, but here we prioritize the highest scoring unique chunk.
        mergedContext.push(chunk);
        uniqueChunks.add(chunk);
      }
    }

    return mergedContext;
  }
}

export { SemanticContextMerger };