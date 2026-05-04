import { Message, ContentBlock, TextBlock, ToolUseBlock, ThinkingBlock } from "./types";

export interface MemoryChunk {
  content: string;
  timestamp: number;
  source: string;
}

export interface TemporalWindow {
  startTime?: number;
  endTime?: number;
  relativeOffsetMinutes?: number;
}

export interface ContextualMemoryRetriever {
  retrieveContext(
    query: string,
    history: Message[],
    window: TemporalWindow
  ): Promise<MemoryChunk[]>;
}

export class TemporalContextualMemoryRetriever implements ContextualMemoryRetriever {
  private memoryStore: MemoryChunk[];

  constructor(memoryStore: MemoryChunk[]) {
    this.memoryStore = memoryStore;
  }

  private applyTemporalFilter(chunks: MemoryChunk[], window: TemporalWindow): MemoryChunk[] {
    if (!window.startTime && !window.endTime && !window.relativeOffsetMinutes) {
      return chunks;
    }

    let filteredChunks: MemoryChunk[] = [...chunks];

    if (window.relativeOffsetMinutes !== undefined) {
      const now = Date.now();
      let effectiveTime: number;

      if (window.relativeOffsetMinutes < 0) {
        effectiveTime = now + window.relativeOffsetMinutes * 60 * 1000;
      } else {
        effectiveTime = now + window.relativeOffsetMinutes * 60 * 1000;
      }

      filteredChunks = filteredChunks.filter(chunk =>
        chunk.timestamp >= effectiveTime - (window.relativeOffsetMinutes * 60 * 1000) &&
        chunk.timestamp <= effectiveTime + (window.relativeOffsetMinutes * 60 * 1000)
      );
    } else {
      if (window.startTime !== undefined && window.endTime !== undefined) {
        filteredChunks = filteredChunks.filter(chunk =>
          chunk.timestamp >= window.startTime && chunk.timestamp <= window.endTime
        );
      } else if (window.startTime !== undefined) {
        filteredChunks = filteredChunks.filter(chunk => chunk.timestamp >= window.startTime);
      } else if (window.endTime !== undefined) {
        filteredChunks = filteredChunks.filter(chunk => chunk.timestamp <= window.endTime);
      }
    }

    return filteredChunks;
  }

  public async retrieveContext(
    query: string,
    history: Message[],
    window: TemporalWindow
  ): Promise<MemoryChunk[]> {
    console.log("Retrieving context with temporal window...");

    // 1. Initial retrieval (simulated: filtering by query/history relevance)
    let relevantChunks = this.memoryStore.filter(chunk =>
      chunk.content.toLowerCase().includes(query.toLowerCase()) ||
      history.some(msg => chunk.content.toLowerCase().includes(msg.content.toLowerCase()))
    );

    // 2. Apply temporal filtering
    const temporallyFilteredChunks = this.applyTemporalFilter(relevantChunks, window);

    return temporallyFilteredChunks;
  }
}