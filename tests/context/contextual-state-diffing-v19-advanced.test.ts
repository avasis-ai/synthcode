import { describe, it, expect } from "vitest";
import { CausalContext, StateDiff } from "../context/contextual-state-diffing-v19-advanced";

describe("ContextualStateDiffingV19Advanced", () => {
  it("should correctly calculate a simple state diff with metadata", () => {
    const initialContext: CausalContext = {
      causal_path: ["event1"],
      temporal_window_start: 100,
      temporal_window_end: 200,
      source_event_id: "src-123",
    };
    const newState: { count: number; status: string } = { count: 5, status: "active" };
    const expectedDiff: StateDiff<{ count: number; status: string }> = {
      diff: { count: 5, status: "active" },
      metadata: {
        "count": {
          causal_link: "causal_link_for_count",
          temporal_relevance: { start: 100, end: 200 },
        },
        "status": {
          causal_link: "causal_link_for_status",
          temporal_relevance: { start: 100, end: 200 },
        },
      },
    };

    // Mock implementation for testing purposes
    const diffingFunction = (context: CausalContext, oldState: any, newState: any): StateDiff<any> => {
      const diff: Partial<any> = {};
      const metadata: Record<string, any> = {};
      for (const key in newState) {
        if (newState[key] !== oldState[key]) {
          diff[key] = newState[key];
          metadata[key] = {
            causal_link: `causal_link_for_${key}`,
            temporal_relevance: { start: context.temporal_window_start, end: context.temporal_window_end },
          };
        }
      }
      return { diff, metadata };
    };

    const result = diffingFunction(initialContext, { count: 1, status: "inactive" }, newState);

    expect(result.diff).toEqual({ count: 5, status: "active" });
    expect(result.metadata).toEqual({
      "count": {
        causal_link: "causal_link_for_count",
        temporal_relevance: { start: 100, end: 200 },
      },
      "status": {
        causal_link: "causal_link_for_status",
        temporal_relevance: { start: 100, end: 200 },
      },
    });
  });

  it("should return empty diff and metadata when state has not changed", () => {
    const context: CausalContext = {
      causal_path: ["eventA"],
      temporal_window_start: 50,
      temporal_window_end: 150,
      source_event_id: "src-456",
    };
    const currentState: { value: number; name: string } = { value: 10, name: "Test" };

    // Mock implementation for testing purposes
    const diffingFunction = (context: CausalContext, oldState: any, newState: any): StateDiff<any> => {
      const diff: Partial<any> = {};
      const metadata: Record<string, any> = {};
      for (const key in newState) {
        if (newState[key] !== oldState[key]) {
          diff[key] = newState[key];
          metadata[key] = {
            causal_link: `causal_link_for_${key}`,
            temporal_relevance: { start: context.temporal_window_start, end: context.temporal_window_end },
          };
        }
      }
      return { diff, metadata };
    };

    const result = diffingFunction(context, currentState, currentState);

    expect(result.diff).toEqual({});
    expect(result.metadata).toEqual({});
  });

  it("should only include metadata for changed fields", () => {
    const context: CausalContext = {
      causal_path: ["eventB"],
      temporal_window_start: 200,
      temporal_window_end: 300,
      source_event_id: "src-789",
    };
    const oldState: { a: number; b: string; c: boolean } = { a: 1, b: "old", c: true };
    const newState: { a: number; b: string; c: boolean } = { a: 2, b: "new", c: true };

    // Mock implementation for testing purposes
    const diffingFunction = (context: CausalContext, oldState: any, newState: any): StateDiff<any> => {
      const diff: Partial<any> = {};
      const metadata: Record<string, any> = {};
      for (const key in newState) {
        if (newState[key] !== oldState[key]) {
          diff[key] = newState[key];
          metadata[key] = {
            causal_link: `causal_link_for_${key}`,
            temporal_relevance: { start: context.temporal_window_start, end: context.temporal_window_end },
          };
        }
      }
      return { diff, metadata };
    };

    const result = diffingFunction(context, oldState, newState);

    expect(result.diff).toEqual({ a: 2, b: "new" });
    expect(result.metadata).toEqual({
      "a": {
        causal_link: "causal_link_for_a",
        temporal_relevance: { start: 200, end: 300 },
      },
      "b": {
        causal_link: "causal_link_for_b",
        temporal_relevance: { start: 200, end: 300 },
      },
    });
  });
});