import { TextBlock, ContentBlock, Message } from "./types";

export interface SourceMetadata {
  documentId: string;
  pageNumber: number;
  url?: string;
}

export interface ContextChunk {
  content: string;
  relevanceScore: number;
}

export interface AttributedContextChunk extends ContextChunk {
  sourceMetadata: SourceMetadata;
}

interface VectorStoreClient {
  query(query: string, topK: number): Promise<AttributedContextChunk[]>;
}

export class ContextualMemoryRetrieverV3 {
  private vectorStore: VectorStoreClient;

  constructor(vectorStore: VectorStoreClient) {
    this.vectorStore = vectorStore;
  }

  async retrieveContext(query: string, topK: number = 5): Promise<AttributedContextChunk[]> {
    try {
      const attributedChunks = await this.vectorStore.query(query, topK);
      return attributedChunks;
    } catch (error) {
      console.error("Error during contextual memory retrieval:", error);
      return [];
    }
  }
}