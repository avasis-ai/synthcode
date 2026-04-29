import { describe, it, expect } from "vitest";
import { ContextualKnowledgeRetrieverWithAttribution } from "../src/context/contextual-knowledge-retriever-with-attribution";

describe("ContextualKnowledgeRetrieverWithAttribution", () => {
  it("should return an empty array when no relevant context is found", async () => {
    const retriever = new ContextualKnowledgeRetrieverWithAttribution(/* Mock dependencies */);
    const query = "non-existent query";
    const topK = 5;
    const result = await retriever.retrieve(query, topK);
    expect(result).toEqual([]);
  });

  it("should return the correct number of attributed context chunks for a given query", async () => {
    const retriever = new ContextualKnowledgeRetrieverWithAttribution(/* Mock dependencies */);
    const query = "relevant topic";
    const topK = 3;
    const result = await retriever.retrieve(query, topK);
    expect(result.length).toBe(topK);
  });

  it("should ensure each returned chunk has valid attribution metadata", async () => {
    const retriever = new ContextualKnowledgeRetrieverWithAttribution(/* Mock dependencies */);
    const query = "any query";
    const topK = 1;
    const result = await retriever.retrieve(query, topK);
    if (result.length > 0) {
      const chunk = result[0];
      expect(chunk.metadata).toBeDefined();
      expect(chunk.metadata.source_id).toBeDefined();
      expect(chunk.metadata.path).toBeDefined();
    }
  });
});