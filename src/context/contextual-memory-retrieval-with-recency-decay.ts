import { Message, ContentBlock, TextBlock, ToolUseBlock, ThinkingBlock } from "./types";

interface MemoryChunk {
  content: string;
  timestamp: number;
  relevanceScore: number;
}

export class ContextualMemoryRetriever {
  private memory: MemoryChunk[] = [];

  constructor(initialMemory: MemoryChunk[] = []) {
    this.memory = initialMemory;
  }

  private decayScore(score: number, timeDeltaMs: number): number {
    const decayFactor = Math.exp(-timeDeltaMs / (3600 * 1000 * 24)); // Decay over 24 hours
    return Math.max(0, score * decayFactor);
  }

  private calculateTimeDelta(timestamp: number): number {
    return Date.now() - timestamp;
  }

  public addMemory(content: string, timestamp: number = Date.now(), relevanceScore: number = 1.0): void {
    const newChunk: MemoryChunk = {
      content,
      timestamp,
      relevanceScore,
    };
    this.memory.push(newChunk);
    this.memory.sort((a, b) => b.timestamp - a.timestamp);
  }

  public retrieve(query: string, topK: number = 5): { decayedChunks: { chunk: MemoryChunk; decayedScore: number }[]; context: string } {
    const timeDelta = this.calculateTimeDelta(Date.now());

    const scoredChunks = this.memory.map(chunk => {
      const timeDeltaMs = this.calculateTimeDelta(chunk.timestamp);
      const decayedScore = this.decayScore(chunk.relevanceScore, timeDeltaMs);
      return { chunk, decayedScore };
    });

    scoredChunks.sort((a, b) => b.decayedScore - a.decayedScore);

    const topKResults = scoredChunks.slice(0, topK);
    const context = topKResults.map(item => `[Context: ${item.chunk.content}]`).join("\n---\n");

    const decayedChunks = topKResults.map(item => ({
      chunk: item.chunk,
      decayedScore: item.decayedScore,
    }));

    return { decayedChunks, context };
  }
}