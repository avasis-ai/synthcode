import { Message, ContentBlock, TextBlock, ToolUseBlock, ThinkingBlock } from "./types";

export interface SourceMetadata {
  source_id: string;
  source_type: "file" | "tool" | "database";
  path: string;
  timestamp: number;
}

export interface AttributedContextChunk {
  chunk: string;
  metadata: SourceMetadata;
}

export interface ContextStore {
  search(query: string, topK: number): Promise<{ chunk: string; metadata: SourceMetadata }[]>;
}

export class ContextualMemoryRetrieverWithAttribution {
  private store: ContextStore;

  constructor(store: ContextStore) {
    this.store = store;
  }

  public async retrieve(query: string, topK: number = 5): Promise<AttributedContextChunk[]> {
    try {
      const results = await this.store.search(query, topK);
      return results.map(result => ({
        chunk: result.chunk,
        metadata: result.metadata,
      }));
    } catch (error) {
      console.error("Error during contextual memory retrieval:", error);
      return [];
    }
  }
}