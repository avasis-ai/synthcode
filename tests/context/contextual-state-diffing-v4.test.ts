import { describe, it, expect } from "vitest";
import { ContextualStateDiffingV4 } from "../src/context/contextual-state-diffing-v4";

describe("ContextualStateDiffingV4", () => {
  it("should correctly calculate diffs when all sources have changes", () => {
    const mockMemory = { getName: () => "memory", getSnapshot: () => ({ user: "new_user" }), diff: (prev) => ({ userDiff: "updated" }) };
    const mockGraph = { getName: () => "graph", getSnapshot: () => ({ nodes: 5 }), diff: (prev) => ({ nodeCountDiff: 5 }) };
    const mockHistory = { getName: () => "history", getSnapshot: () => ({ count: 10 }), diff: (prev) => ({ historyLengthDiff: 10 }) };

    const diffing = new ContextualStateDiffingV4(mockMemory, mockGraph, mockHistory);
    const diff = diffing.calculateDiff();

    expect(diff).toHaveProperty("memory");
    expect(diff.memory).toEqual({ source: "memory", diff: { userDiff: "updated" } });
    expect(diff).toHaveProperty("graph");
    expect(diff.graph).toEqual({ source: "graph", diff: { nodeCountDiff: 5 } });
    expect(diff).toHaveProperty("history");
    expect(diff.history).toEqual({ source: "history", diff: { historyLengthDiff: 10 } });
  });

  it("should only include diffs from sources that report changes", () => {
    const mockMemory = { getName: () => "memory", getSnapshot: () => ({ user: "old_user" }), diff: (prev) => (prev.user === "old_user" ? null : { userDiff: "updated" }) };
    const mockGraph = { getName: () => "graph", getSnapshot: () => ({ nodes: 3 }), diff: (prev) => ({ nodeCountDiff: 3 }) };
    const mockHistory = { getName: () => "history", getSnapshot: () => ({ count: 5 }), diff: (prev) => (prev.count === 5 ? null : { historyLengthDiff: 5 }) };

    // Simulate no change in memory and history
    const mockMemoryNoChange = { getName: () => "memory", getSnapshot: () => ({ user: "old_user" }), diff: (prev) => (prev.user === "old_user" ? null : { userDiff: "updated" }) };
    const mockGraphAlwaysChanges = { getName: () => "graph", getSnapshot: () => ({ nodes: 3 }), diff: (prev) => ({ nodeCountDiff: 3 }) };
    const mockHistoryNoChange = { getName: () => "history", getSnapshot: () => ({ count: 5 }), diff: (prev) => (prev.count === 5 ? null : { historyLengthDiff: 5 }) };

    const diffing = new ContextualStateDiffingV4(mockMemoryNoChange, mockGraphAlwaysChanges, mockHistoryNoChange);
    const diff = diffing.calculateDiff();

    expect(diff).toHaveProperty("memory"); // Should still be present if the structure expects it, but the diff should be null/empty if the implementation handles it that way.
    expect(diff.memory.diff).toBeNull();
    expect(diff).toHaveProperty("graph");
    expect(diff.graph.diff).toEqual({ nodeCountDiff: 3 });
    expect(diff).toHaveProperty("history");
    expect(diff.history.diff).toBeNull();
  });

  it("should handle an empty context state gracefully", () => {
    const mockMemory = { getName: () => "memory", getSnapshot: () => ({}), diff: () => null };
    const mockGraph = { getName: () => "graph", getSnapshot: () => ({}), diff: () => null };
    const mockHistory = { getName: () => "history", getSnapshot: () => ({}), diff: () => null };

    const diffing = new ContextualStateDiffingV4(mockMemory, mockGraph, mockHistory);
    const diff = diffing.calculateDiff();

    expect(diff).toEqual({
      memory: { source: "memory", diff: null },
      graph: { source: "graph", diff: null },
      history: { source: "history", diff: null },
    });
  });
});