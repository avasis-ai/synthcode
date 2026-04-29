import { describe, it, expect } from "vitest";
import { ContextualMemoryRetrieverV3, SourceMetadata, AttributedContextChunk } from "../src/context/contextual-memory-retrieval-with-source-attribution-v3";

describe("ContextualMemoryRetrieverV3", () => {
  it("should correctly retrieve and attribute context chunks when the vector store returns results", async () => {
    const mockVectorStore: any = {
      query: async (query: string, topK: number) => {
        const chunk1: AttributedContextChunk = {
          content: "This is the first relevant piece of context.",
          relevanceScore: 0.95,
          sourceMetadata: { documentId: "doc1", pageNumber: 5, url: "http://example.com/doc1" },
        };
        const chunk2: AttributedContextChunk = {
          content: "Another piece of context from a different source.",
          relevanceScore: 0.88,
          sourceMetadata: { documentId: "doc2", pageNumber: 12 },
        };
        return [chunk1, chunk2];
      },
    };

    const retriever = new ContextualMemoryRetrieverV3(mockVectorStore);
    const query = "What is the main topic?";
    const topK = 2;

    const results = await retriever.retrieveContext(query, topK);

    expect(results).toHaveLength(2);
    expect(results[0].content).toBe("This is the first relevant piece of context.");
    expect(results[0].sourceMetadata.documentId).toBe("doc1");
    expect(results[0].sourceMetadata.pageNumber).toBe(5);
    expect(results[1].content).toBe("Another piece of context from a different source.");
    expect(results[1].sourceMetadata.documentId).toBe("doc2");
  });

  it("should return an empty array when the vector store finds no relevant context", async () => {
    const mockVectorStore: any = {
      query: async (query: string, topK: number) => {
        return [];
      },
    };

    const retriever = new ContextualMemoryRetrieverV3(mockVectorStore);
    const query = "Completely unrelated query";
    const topK = 5;

    const results = await retriever.retrieveContext(query, topK);

    expect(results).toEqual([]);
  });

  it("should handle a query with a high topK value gracefully", async () => {
    const mockVectorStore: any = {
      query: async (query: string, topK: number) => {
        const chunk1: AttributedContextChunk = {
          content: "First result.",
          relevanceScore: 0.9,
          sourceMetadata: { documentId: "d1", pageNumber: 1 },
        };
        const chunk2: AttributedContextChunk = {
          content: "Second result.",
          relevanceScore: 0.8,
          sourceMetadata: { documentId: "d2", pageNumber: 2 },
        };
        // Simulate returning only 2 results even if topK is 5
        return [chunk1, chunk2];
      },
    };

    const retriever = new ContextualMemoryRetrieverV3(mockVectorStore);
    const query = "Test high K";
    const topK = 5;

    const results = await retriever.retrieveContext(query, topK);

    expect(results).toHaveLength(2);
    expect(results[0].content).toBe("First result.");
  });
});