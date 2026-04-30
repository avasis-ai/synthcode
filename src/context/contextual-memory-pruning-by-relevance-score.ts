import { Message, ContentBlock, TextBlock, ToolUseBlock, ThinkingBlock } from "./types";

export interface RelevanceScorer {
  score: (query: string, chunk: string) => number;
}

export class ContextualMemoryPruningByRelevanceScore {
  private scorer: RelevanceScorer;
  private topK: number;
  private threshold: number;

  constructor(scorer: RelevanceScorer, topK: number = 5, threshold: number = 0.1) {
    this.scorer = scorer;
    this.topK = topK;
    this.threshold = threshold;
  }

  private calculateScore(query: string, chunk: string): number {
    return this.scorer.score(query, chunk);
  }

  private pruneChunks(
    query: string,
    memoryChunks: { chunk: string; metadata: Record<string, unknown> }[]
  ): { prunedChunks: { chunk: string; metadata: Record<string, unknown> }[]; finalScore: number } {
    const scoredChunks = memoryChunks.map(async (memoryChunk) => {
      const score = this.calculateScore(query, memoryChunk.chunk);
      return {
        chunk: memoryChunk.chunk,
        metadata: memoryChunk.metadata,
        score: score,
      };
    });

    const results = Promise.all(scoredChunks);

    const sortedResults = results.then((scoredChunks: { chunk: string; metadata: Record<string, unknown>; score: number }[]) => {
      return scoredChunks.sort((a, b) => b.score - a.score);
    });

    const pruned = sortedResults.then((sorted: { chunk: string; metadata: Record<string, unknown>; score: number }[]) => {
      const filtered = sorted.filter(item => item.score >= this.threshold);
      const topKFiltered = filtered.slice(0, this.topK);

      const finalPruned: { chunk: string; metadata: Record<string, unknown> }[] = topKFiltered.map(item => ({
        chunk: item.chunk,
        metadata: item.metadata,
      }));

      const finalScore = topKFiltered.length > 0 ? topKFiltered[0].score : 0.0;

      return { prunedChunks: finalPruned, finalScore };
    });

    return pruned;
  }

  public async prune(
    query: string,
    memoryChunks: { chunk: string; metadata: Record<string, unknown> }[]
  ): Promise<{ prunedChunks: { chunk: string; metadata: Record<string, unknown> }[]; finalScore: number }> {
    return this.pruneChunks(query, memoryChunks);
  }
}