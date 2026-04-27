import { Message, ContentBlock, TextBlock, ToolUseBlock, ThinkingBlock } from "./types";

interface VectorStoreClient {
  queryNearestNeighbors(embedding: Float32Array, topK: number): Promise<{ context: string; similarity: number }[]>;
}

interface Cache {
  get(key: string): any;
  set(key: string, value: any, ttlSeconds: number): void;
}

export class SemanticContextCache {
  private vectorStore: VectorStoreClient;
  private cacheStore: Cache;
  private readonly similarityThreshold: number;
  private readonly cacheTtlSeconds: number;

  constructor(vectorStore: VectorStoreClient, cacheStore: Cache, similarityThreshold: number = 0.8, cacheTtlSeconds: number = 3600) {
    this.vectorStore = vectorStore;
    this.cacheStore = cacheStore;
    this.similarityThreshold = similarityThreshold;
    this.cacheTtlSeconds = cacheTtlSeconds;
  }

  private generateEmbedding(text: string): Float32Array {
    // Mock embedding generation for demonstration purposes
    const hash = Array.from(text).reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return new Float32Array([hash / 1000.0, Math.sin(hash) * 0.1, Math.cos(hash) * 0.1]);
  }

  private generateCacheKey(embedding: Float32Array): string {
    // Simple deterministic key generation from embedding components
    return `${embedding[0].toFixed(4)}_${embedding[1].toFixed(4)}_${embedding[2].toFixed(4)}`;
  }

  public async checkAndRetrieveContext(query: string, embedding: Float32Array, topK: number = 3): Promise<{ context: string; source: 'cache' | 'vector_store' }> {
    const cacheKey = this.generateCacheKey(embedding);

    // 1. Check in in-memory/Redis cache first
    const cachedData = this.cacheStore.get(cacheKey);
    if (cachedData && cachedData.expiry > Date.now()) {
      return { context: cachedData.context, source: 'cache' };
    }

    // 2. Query vector store for semantic neighbors
    try {
      const neighbors = await this.vectorStore.queryNearestNeighbors(embedding, topK);

      if (neighbors.length > 0) {
        const bestMatch = neighbors[0];

        if (bestMatch.similarity >= this.similarityThreshold) {
          const context = bestMatch.context;

          // Cache the result if similarity is high enough
          this.cacheStore.set(cacheKey, { context: context, timestamp: Date.now() }, this.cacheTtlSeconds);
          return { context: context, source: 'vector_store' };
        }
      }
    } catch (error) {
      console.error("Error querying vector store:", error);
      // Fall through to returning empty context if vector store fails
    }

    // 3. No suitable match found or cache expired/missed
    return { context: "", source: 'none' };
  }

  public async cacheContext(query: string, context: string, embedding: Float32Array): Promise<void> {
    const cacheKey = this.generateCacheKey(embedding);
    this.cacheStore.set(cacheKey, { context: context, timestamp: Date.now() }, this.cacheTtlSeconds);
  }
}