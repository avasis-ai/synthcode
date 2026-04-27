import { describe, it, expect, vi } from "vitest";
import { SemanticContextRetriever, EmbeddingService, VectorStore } from "../src/context/semantic-context-retriever";

describe("SemanticContextRetriever", () => {
  it("should initialize correctly with embedding service and vector store", async () => {
    const mockEmbeddingService: EmbeddingService = {
      embed: vi.fn().mockResolvedValue(new Float32Array([0.1, 0.2])),
    };
    const mockVectorStore: VectorStore = {
      search: vi.fn().mockResolvedValue([]),
    };

    const retriever = new SemanticContextRetriever(mockEmbeddingService, mockVectorStore);

    expect(retriever).toBeDefined();
  });

  it("should embed the query and search the vector store", async () => {
    const mockEmbeddingService: EmbeddingService = {
      embed: vi.fn().mockResolvedValue(new Float32Array([0.3, 0.4])),
    };
    const mockVectorStore: VectorStore = {
      search: vi.fn().mockResolvedValue([
        { chunk: { content: "Relevant info 1", metadata: {} }, score: 0.9 },
        { chunk: { content: "Irrelevant info 2", metadata: {} }, score: 0.7 },
      ]),
    };

    const retriever = new SemanticContextRetriever(mockEmbeddingService, mockVectorStore);
    const query = "What is the main topic?";

    const result = await retriever.retrieveContext(query, 2);

    expect(mockEmbeddingService.embed).toHaveBeenCalledWith(query);
    expect(mockVectorStore.search).toHaveBeenCalledWith(
      new Float32Array([0.3, 0.4]),
      2
    );
    expect(result).toHaveLength(2);
    expect(result[0].content).toBe("Relevant info 1");
  });

  it("should handle empty search results gracefully", async () => {
    const mockEmbeddingService: EmbeddingService = {
      embed: vi.fn().mockResolvedValue(new Float32Array([0.5, 0.6])),
    };
    const mockVectorStore: VectorStore = {
      search: vi.fn().mockResolvedValue([]),
    };

    const retriever = new SemanticContextRetriever(mockEmbeddingService, mockVectorStore);
    const query = "Empty query test";

    const result = await retriever.retrieveContext(query, 3);

    expect(mockEmbeddingService.embed).toHaveBeenCalledTimes(1);
    expect(mockVectorStore.search).toHaveBeenCalledTimes(1);
    expect(result).toEqual([]);
  });
});