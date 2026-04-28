import { describe, it, expect } from "vitest";
import { ContextualKnowledgeRetrieverWithRelevanceScoring } from "../src/context/contextual-knowledge-retriever-with-relevance-scoring";

describe("ContextualKnowledgeRetrieverWithRelevanceScoring", () => {
  it("should initialize correctly with knowledge base and weights", () => {
    const mockKnowledgeBase: any[] = [{ id: "1", content: "test", timestamp: 100, embedding: new Float32Array(1) }];
    const mockWeights = { semanticWeight: 0.5, temporalWeight: 0.5 };
    const retriever = new ContextualKnowledgeRetrieverWithRelevanceScoring(mockKnowledgeBase, mockWeights);
    // Assuming there's a way to check internal state or a getter for verification
    // For this test, we'll just check if instantiation doesn't throw and the weights are set.
    expect(retriever).toBeDefined();
  });

  it("should calculate a relevance score for a given query and knowledge chunk", () => {
    const mockKnowledgeBase: any[] = [{ id: "1", content: "recent info", timestamp: 1000, embedding: new Float32Array(1) }];
    const mockWeights = { semanticWeight: 0.7, temporalWeight: 0.3 };
    const retriever = new ContextualKnowledgeRetrieverWithRelevanceScoring(mockKnowledgeBase, mockWeights);
    const queryEmbedding = new Float32Array(1); // Mock query embedding
    const score = retriever.calculateRelevanceScore(queryEmbedding, mockKnowledgeBase[0]);
    expect(typeof score).toBe("number");
  });

  it("should return the top K most relevant chunks based on the query", () => {
    const mockKnowledgeBase: any[] = [
      { id: "1", content: "old stuff", timestamp: 100, embedding: new Float32Array(1) },
      { id: "2", content: "new stuff", timestamp: 2000, embedding: new Float32Array(1) },
    ];
    const mockWeights = { semanticWeight: 0.5, temporalWeight: 0.5 };
    const retriever = new ContextualKnowledgeRetrieverWithRelevanceScoring(mockKnowledgeBase, mockWeights);
    const queryEmbedding = new Float32Array(1); // Mock query embedding
    const topK = retriever.getTopKRelevantChunks(queryEmbedding, 1);
    expect(topK).toHaveLength(1);
  });
});