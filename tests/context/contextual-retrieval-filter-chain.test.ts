import { describe, it, expect } from "vitest";
import { ContextualRetrievalFilterChain, ContextFilter } from "../src/context/contextual-retrieval-filter-chain";
import { ContextChunk, ContextState } from "../src/context/types";

describe("ContextualRetrievalFilterChain", () => {
  it("should return all chunks if no filters are provided", () => {
    const chain = new ContextualRetrievalFilterChain([]);
    const chunks: ContextChunk[] = [{ id: "1", content: "test" }];
    const contextState: ContextState = {};
    const result = chain.filterAll(chunks, contextState);
    expect(result).toEqual(chunks);
  });

  it("should filter out chunks that fail any filter", () => {
    const failingFilter: ContextFilter = (context, state) => {
      return context.id !== "keep-me";
    };
    const chain = new ContextualRetrievalFilterChain([failingFilter]);
    const chunks: ContextChunk[] = [
      { id: "keep-me", content: "good" },
      { id: "discard-me", content: "bad" },
    ];
    const contextState: ContextState = {};
    const result = chain.filterAll(chunks, contextState);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("keep-me");
  });

  it("should only keep chunks that pass all registered filters", () => {
    const filter1: ContextFilter = (context, state) => context.content.includes("A");
    const filter2: ContextFilter = (context, state) => state.someStateKey === "A";

    const chain = new ContextualRetrievalFilterChain([filter1, filter2]);
    const chunks: ContextChunk[] = [
      { id: "1", content: "Alpha content" }, // Passes filter1, fails filter2 (state missing)
      { id: "2", content: "Beta content" },  // Fails filter1
    ];
    const contextState: ContextState = { someStateKey: "A" }; // Passes filter2 for all
    const result = chain.filterAll(chunks, contextState);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("1");
  });
});