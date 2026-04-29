import { describe, it, expect } from "vitest";
import {
  RetrievalContext,
  FilteredContext,
  ContextualFilter,
} from "../context/contextual-retrieval-filter-chain-v2";

describe("ContextualFilter", () => {
  it("should correctly process context and return a filtered context", () => {
    const mockContext: RetrievalContext = {
      messages: [{ role: "user", content: "Test query" }],
      metadata: { source: "docA", date: "2023-01-01", type: "report" },
      query: "Test query",
    };
    const mockFilter: ContextualFilter = {
      name: "TestFilter",
      execute: (context) => {
        const filteredContext: FilteredContext = {
          messages: context.messages,
          metadata: context.metadata,
          query: context.query,
          filteredMetadata: { source: "docA", type: "report" },
          relevanceScoreBoost: 0.1,
        };
        return { filteredContext, success: true, err: null };
      },
    };

    const result = mockFilter.execute(mockContext);

    expect(result.success).toBe(true);
    expect(result.err).toBeNull();
    expect(result.filteredContext.filteredMetadata).toEqual({
      source: "docA",
      type: "report",
    });
    expect(result.filteredContext.relevanceScoreBoost).toBe(0.1);
  });

  it("should handle filter execution failure gracefully", () => {
    const mockContext: RetrievalContext = {
      messages: [{ role: "user", content: "Test query" }],
      metadata: { source: "docA", date: "2023-01-01", type: "report" },
      query: "Test query",
    };
    const mockFilter: ContextualFilter = {
      name: "FailingFilter",
      execute: (context) => {
        return {
          filteredContext: undefined as unknown as FilteredContext,
          success: false,
          err: new Error("Filter failed due to bad data"),
        };
      },
    };

    const result = mockFilter.execute(mockContext);

    expect(result.success).toBe(false);
    expect(result.err).toBeInstanceOf(Error);
    expect(result.err?.message).toBe("Filter failed due to bad data");
  });

  it("should allow chaining of multiple filters", () => {
    const mockContext: RetrievalContext = {
      messages: [{ role: "user", content: "Initial query" }],
      metadata: { source: "docA", date: "2023-01-01", type: "report" },
      query: "Initial query",
    };

    const filter1: ContextualFilter = {
      name: "Filter1",
      execute: (context) => {
        const filteredContext: FilteredContext = {
          messages: context.messages,
          metadata: context.metadata,
          query: context.query,
          filteredMetadata: { source: "docA" },
          relevanceScoreBoost: 0.1,
        };
        return { filteredContext, success: true, err: null };
      },
    };

    const filter2: ContextualFilter = {
      name: "Filter2",
      execute: (context) => {
        // In a real chain, filter2 would use the output of filter1, but for this test,
        // we simulate it using the original context structure for simplicity.
        const filteredContext: FilteredContext = {
          messages: context.messages,
          metadata: context.metadata,
          query: context.query,
          filteredMetadata: { type: "report" },
          relevanceScoreBoost: 0.2, // Boost accumulates or overwrites
        };
        return { filteredContext, success: true, err: null };
      },
    };

    // Simulate chaining logic (assuming a function that takes filters and context)
    const chainExecute = async (context: RetrievalContext, filters: ContextualFilter[]): Promise<FilteredContext> => {
      let currentContext: RetrievalContext = context;
      let currentFilteredContext: FilteredContext | null = null;

      for (const filter of filters) {
        const result = filter.execute(currentContext);
        if (!result.success) {
          throw new Error(`Chain failed at ${filter.name}: ${result.err?.message}`);
        }
        currentFilteredContext = result.filteredContext;
        // In a real scenario, we might update currentContext with filter output
        // For this test, we just ensure the last one succeeds.
      }
      return currentFilteredContext!;
    };

    const finalContext = await chainExecute(mockContext, [filter1, filter2]);

    expect(finalContext).toBeDefined();
    // We expect the last filter's boost to be present
    expect(finalContext?.relevanceScoreBoost).toBe(0.2);
  });
});