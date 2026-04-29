import { Message, ContentBlock, TextBlock, ToolUseBlock, ThinkingBlock } from "./types";

export interface SourceMetadata {
  documentId: string;
  pageNumber: number;
  sourceType: "document" | "database" | "api";
}

export interface AttributedContextChunk {
  content: string;
  sourceMetadata: SourceMetadata;
}

export interface ContextChunk {
  content: string;
}

export class AttributedContextMerger {
  private chunks: Map<string, AttributedContextChunk> = new Map();

  merge(newChunks: AttributedContextChunk[]): AttributedContextChunk[] {
    for (const chunk of newChunks) {
      const key = `${chunk.content}|${chunk.sourceMetadata.documentId}|${chunk.sourceMetadata.pageNumber}`;
      if (!this.chunks.has(key)) {
        this.chunks.set(key, chunk);
      }
    }
    return Array.from(this.chunks.values());
  }

  clear() {
    this.chunks.clear();
  }
}

export class ContextualMemoryRetrieverV2 {
  private vectorStore: {
    search: (query: string, k: number) => Promise<AttributedContextChunk[]>;
  };

  constructor(vectorStore: {
    search: (query: string, k: number) => Promise<AttributedContextChunk[]>;
  }) {
    this.vectorStore = vectorStore;
  }

  async retrieveContext(query: string, k: number = 5): Promise<AttributedContextChunk[]> {
    return this.vectorStore.search(query, k);
  }
}

export class ContextualMemoryManagerV2 {
  private merger: AttributedContextMerger = new AttributedContextMerger();
  private retriever: ContextualMemoryRetrieverV2;

  constructor(vectorStore: {
    search: (query: string, k: number) => Promise<AttributedContextChunk[]>;
  }) {
    this.retriever = new ContextualMemoryRetrieverV2(vectorStore);
  }

  async retrieveAndMergeContext(query: string, k: number = 5): Promise<AttributedContextChunk[]> {
    const rawChunks = await this.retriever.retrieveContext(query, k);
    const mergedChunks = this.merger.merge(rawChunks);
    return mergedChunks;
  }

  async processAndMergeContext(newChunks: AttributedContextChunk[]): Promise<AttributedContextChunk[]> {
    const mergedChunks = this.merger.merge(newChunks);
    return mergedChunks;
  }

  clearContext() {
    this.merger.clear();
  }
}