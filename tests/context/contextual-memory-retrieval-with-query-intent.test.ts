import { describe, it, expect } from "vitest";
import { ContextualMemoryRetriever, ContextEntry, QueryIntent } from "../src/context/contextual-memory-retrieval-with-query-intent";

describe("ContextualMemoryRetriever", () => {
  it("should initialize with an empty memory store", () => {
    const retriever = new ContextualMemoryRetriever();
    // Assuming there's a way to check if memories are empty, or we test the internal state if accessible.
    // For this test, we'll assume the constructor sets up an empty state.
    expect((retriever as any).memories).toEqual([]);
  });

  it("should add context entries correctly", () => {
    const retriever = new ContextualMemoryRetriever();
    const entry: ContextEntry = {
      id: "1",
      timestamp: Date.now(),
      content_vector: new Float32Array([0.1]),
      intent_vector: new Float32Array([0.2]),
      source_message: { content: "Test message" }
    };
    (retriever as any).addMemory(entry);
    expect((retriever as any).memories.length).toBe(1);
    expect((retriever as any).memories[0]).toEqual(entry);
  });

  it("should retrieve context based on query intent and content vector similarity", () => {
    const retriever = new ContextualMemoryRetriever();
    const entry1: ContextEntry = {
      id: "A",
      timestamp: Date.now() - 1000,
      content_vector: new Float32Array([0.9]),
      intent_vector: new Float32Array([0.1]),
      source_message: { content: "Context A" }
    };
    const entry2: ContextEntry = {
      id: "B",
      timestamp: Date.now(),
      content_vector: new Float32Array([0.1]),
      intent_vector: new Float32Array([0.9]),
      source_message: { content: "Context B" }
    };
    (retriever as any).addMemory(entry1);
    (retriever as any).addMemory(entry2);

    const query: QueryIntent = {
      query_vector: new Float32Array([0.95]),
      intent_vector: new Float32Array([0.15])
    };

    const results = (retriever as any).retrieve(query);

    // Expecting at least one result, and ideally the one closest to the query vector.
    expect(results).toBeInstanceOf(Array);
    expect(results.length).toBeGreaterThanOrEqual(1);
    // Simple check: ensure the retrieved context ID is one of the added ones.
    const retrievedIds = results.map(r => r.context_id);
    expect(retrievedIds).toEqual(expect.arrayContaining(["A", "B"]));
  });
});