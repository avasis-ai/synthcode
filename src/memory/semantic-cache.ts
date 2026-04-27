import { Float32Array } from "node:buffer";

export type Message = UserMessage | AssistantMessage | ToolResultMessage;

export interface UserMessage {
  role: "user";
  content: string;
}

export interface AssistantMessage {
  role: "assistant";
  content: ContentBlock[];
}

export interface ToolResultMessage {
  role: "tool";
  tool_use_id: string;
  content: string;
  is_error?: boolean;
}

export type ContentBlock = TextBlock | ToolUseBlock | ThinkingBlock;

export interface TextBlock {
  type: "text";
  text: string;
}

export interface ToolUseBlock {
  type: "tool_use";
  id: string;
  name: string;
  input: Record<string, unknown>;
}

export interface ThinkingBlock {
  type: "thinking";
  thinking: string;
}

export type LoopEvent =
  | { type: "text"; text: string }
  | { type: "thinking"; thinking: string }
  | { type: "tool_result"; tool_use_id: string; content: string };

export interface CacheMetadata {
  source: "message" | "document";
  original_content: string;
  timestamp: number;
}

export interface CacheEntry {
  vector: Float32Array;
  metadata: CacheMetadata;
}

export interface EmbeddingGenerator {
  generate(text: string): Promise<Float32Array>;
}

export interface CacheHit {
  entry: CacheEntry;
  similarity: number;
}

export class SemanticCache {
  private cache: CacheEntry[] = [];
  private readonly embeddingGenerator: EmbeddingGenerator;
  private readonly embeddingDimension: number;

  constructor(embeddingGenerator: EmbeddingGenerator, embeddingDimension: number) {
    this.embeddingGenerator = embeddingGenerator;
    this.embeddingDimension = embeddingDimension;
  }

  private static cosineSimilarity(vecA: Float32Array, vecB: Float32Array): number {
    let dotProduct = 0;
    for (let i = 0; i < vecA.length; i++) {
      dotProduct += vecA[i] * vecB[i];
    }

    let magnitudeA = 0;
    let magnitudeB = 0;
    for (let i = 0; i < vecA.length; i++) {
      magnitudeA += vecA[i] * vecA[i];
      magnitudeB += vecB[i] * vecB[i];
    }

    return dotProduct / (Math.sqrt(magnitudeA) * Math.sqrt(magnitudeB));
  }

  public async add(text: string, metadata: CacheMetadata): Promise<void> {
    const vector = await this.embeddingGenerator.generate(text);
    if (vector.length !== this.embeddingDimension) {
      throw new Error("Generated vector dimension mismatch.");
    }
    const newEntry: CacheEntry = {
      vector: vector,
      metadata: metadata,
    };
    this.cache.push(newEntry);
  }

  public async query(queryText: string, topN: number = 5): Promise<CacheHit[]> {
    const queryVector = await this.embeddingGenerator.generate(queryText);
    if (queryVector.length !== this.embeddingDimension) {
      throw new Error("Query vector dimension mismatch.");
    }

    const hits: CacheHit[] = this.cache.map(entry => {
      const similarity = SemanticCache.cosineSimilarity(queryVector, entry.vector);
      return { entry: entry, similarity: similarity };
    });

    hits.sort((a, b) => b.similarity - a.similarity);

    return hits.slice(0, topN);
  }
}