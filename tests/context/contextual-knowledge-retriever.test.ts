import { describe, it, expect } from "vitest";
import { ContextualKnowledgeRetriever } from "../src/context/contextual-knowledge-retriever";

describe("ContextualKnowledgeRetriever", () => {
  it("should initialize correctly with sources and a fusion strategy", async () => {
    const mockSource1 = { name: "source1", retrieve: async () => ({ source: "s1", contextPayload: {}, score: 0.9 }) } as any;
    const mockSource2 = { name: "source2", retrieve: async () => ({ source: "s2", contextPayload: {}, score: 0.8 }) } as any;
    const mockFusionStrategy = { fuse: async (results: any[]) => ({ fusedContext: "fused" }) } as any;

    const retriever = new ContextualKnowledgeRetriever([mockSource1, mockSource2], mockFusionStrategy);

    expect(retriever).toBeDefined();
    expect(retriever.sources.length).toBe(2);
  });

  it("should retrieve context from all sources and fuse them", async () => {
    const mockSource1 = { name: "source1", retrieve: async (query: string, context: any) => ({ source: "s1", contextPayload: { info: "from s1" }, score: 0.9 }) } as any;
    const mockSource2 = { name: "source2", retrieve: async (query: string, context: any) => ({ source: "s2", contextPayload: { info: "from s2" }, score: 0.8 }) } as any;
    const mockFusionStrategy = { fuse: async (results: any[]) => {
      expect(results.length).toBe(2);
      return { fusedContext: "fused context" };
    } } as any;

    const retriever = new ContextualKnowledgeRetriever([mockSource1, mockSource2], mockFusionStrategy);
    const context: any = { history: [], currentQuery: "test query", state: {} };

    const result = await retriever.retrieveContext(context, "test query");

    expect(result).toEqual({ fusedContext: "fused context" });
  });

  it("should handle empty sources gracefully", async () => {
    const mockFusionStrategy = { fuse: async (results: any[]) => ({ fusedContext: "empty" }) } as any;
    const retriever = new ContextualKnowledgeRetriever([], mockFusionStrategy);
    const context: any = { history: [], currentQuery: "test query", state: {} };

    const result = await retriever.retrieveContext(context, "test query");

    expect(result).toEqual({ fusedContext: "empty" });
  });
});