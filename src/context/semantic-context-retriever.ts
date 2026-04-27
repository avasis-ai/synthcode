import { TextBlock, ContentBlock } from "./types";

export interface EmbeddingService {
  embed(text: string): Promise<Float32Array>;
}

export interface ContextChunk {
  content: string;
  metadata: Record<string, any>;
}

export interface VectorStore {
  search(embedding: Float32Array, k: number): Promise<{ chunk: ContextChunk; score: number }[]>;
}

export class SemanticContextRetriever {
  private embeddingService: EmbeddingService;
  private vectorStore: VectorStore;

  constructor(embeddingService: EmbeddingService, vectorStore: VectorStore) {
    this.embeddingService = embeddingService;
    this.vectorStore = vectorStore;
  }

  async retrieve(query: string, k: number): Promise<ContextChunk[]> {
    const queryEmbedding = await this.embeddingService.embed(query);
    const results = await this.vectorStore.search(queryEmbedding, k);
    return results.map(result => result.chunk);
  }
}