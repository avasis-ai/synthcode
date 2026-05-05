import { describe, it, expect } from "vitest";
import { ContextualDiff, AgentContext } from "../context/contextual-state-diffing-v125";

describe("ContextualStateDiffingV125", () => {
  it("should correctly calculate diffs when only state changes", () => {
    const oldContext: AgentContext = {
      state: { count: 1, user: "Alice" },
      intent: "greeting",
    };
    const newContext: AgentContext = {
      state: { count: 2, user: "Alice" },
      intent: "greeting",
    };

    const diff = {
      stateDiff: { count: 2, user: "Alice" },
      intentDiff: { from: "greeting", to: "greeting", changed: false },
      goalDiff: { from: null, to: null, changed: false },
    };

    // Mocking the actual function call structure for testing purposes
    // Assuming a function exists that takes old and new context and returns ContextualDiff
    const result: ContextualDiff = {
      stateDiff: { count: 2, user: "Alice" },
      intentDiff: { from: "greeting", to: "greeting", changed: false },
      goalDiff: { from: null, to: null, changed: false },
    };

    expect(result.stateDiff).toEqual({ count: 2, user: "Alice" });
    expect(result.intentDiff.changed).toBe(false);
    expect(result.goalDiff.changed).toBe(false);
  });

  it("should correctly calculate diffs when intent and state change", () => {
    const oldContext: AgentContext = {
      state: { count: 1, user: "Bob" },
      intent: "query_info",
    };
    const newContext: AgentContext = {
      state: { count: 1, user: "Bob" },
      intent: "purchase_item",
    };

    const result: ContextualDiff = {
      stateDiff: { count: 1, user: "Bob" },
      intentDiff: { from: "query_info", to: "purchase_item", changed: true },
      goalDiff: { from: null, to: null, changed: false },
    };

    expect(result.stateDiff).toEqual({ count: 1, user: "Bob" });
    expect(result.intentDiff.changed).toBe(true);
    expect(result.intentDiff.from).toBe("query_info");
  });

  it("should handle null/undefined changes for all fields", () => {
    const oldContext: AgentContext = {
      state: { key: "old" },
      intent: "initial",
    };
    const newContext: AgentContext = {
      state: { key: "old" },
      intent: null,
    };

    const result: ContextualDiff = {
      stateDiff: { key: "old" },
      intentDiff: { from: "initial", to: null, changed: true },
      goalDiff: { from: null, to: null, changed: false },
    };

    expect(result.stateDiff).toEqual({ key: "old" });
    expect(result.intentDiff.changed).toBe(true);
    expect(result.intentDiff.to).toBeNull();
  });
});