import { describe, it, expect } from "vitest";
import { ContextualMemoryRetrieverWithAttribution } from "../src/context/contextual-memory-retrieval-with-source-attribution";

describe("ContextualMemoryRetrieverWithAttribution", () => {
  it("should correctly retrieve and attribute context chunks when the query is relevant", async () => {
    const mockStore = {
      search: async (query: string, topK: number) => {
        if (query === "What is the main goal?") {
          return [
            { chunk: "The main goal is to improve user experience.", metadata: { source_id: "file1", source_type: "file", path: "/docs/goal.md", timestamp: 1678886400 } },
            { chunk: "UX improvement is key for adoption.", metadata: { source_id: "toolA", source_type: "tool", path: "/tool/a", timestamp: 1678886500 } },
          ];
        }
        return [];
      },
    };

    const retriever = new ContextualMemoryRetrieverWithAttribution(mockStore);
    const results = await retriever.retrieveContext("What is the main goal?", 2);

    expect(results).toHaveLength(2);
    expect(results[0].chunk).toContain("main goal");
    expect(results[0].metadata.source_type).toBe("file");
    expect(results[1].metadata.source_type).toBe("tool");
  });

  it("should return an empty array if no context is found for the query", async () => {
    const mockStore = {
      search: async (query: string, topK: number) => {
        if (query === "non-existent query") {
          return [];
        }
        return [{ chunk: "some data", metadata: { source_id: "file1", source_type: "file", path: "/docs/file.md", timestamp: 123 } }];
      },
    };

    const retriever = new ContextualMemoryRetrieverWithAttribution(mockStore);
    const results = await retriever.retrieveContext("non-existent query", 5);

    expect(results).toEqual([]);
  });

  it("should respect the topK limit when retrieving context", async () => {
    const mockStore = {
      search: async (query: string, topK: number) => {
        if (query === "limit test") {
          return [
            { chunk: "Chunk 1", metadata: { source_id: "s1", source_type: "file", path: "/p1", timestamp: 1 } },
            { chunk: "Chunk 2", metadata: { source_id: "s2", source_type: "file", path: "/p2", timestamp: 2 } },
            { chunk: "Chunk 3", metadata: { source_id: "s3", source_type: "file", path: "/p3", timestamp: 3 } },
            { chunk: "Chunk 4", metadata: { source_id: "s4", source_type: "file", path: "/p4", timestamp: 4 } },
          ];
        }
        return [];
      },
    };

    const retriever = new ContextualMemoryRetrieverWithAttribution(mockStore);
    const results = await retriever.retrieveContext("limit test", 2);

    expect(results).toHaveLength(2);
    expect(results[0].chunk).toBe("Chunk 1");
    expect(results[1].chunk).toBe("Chunk 2");
  });
});