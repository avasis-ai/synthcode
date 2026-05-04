import { describe, it, expect } from "vitest";
import { ContextualStateDiffer } from "../src/context/contextual-state-diffing-v108";

describe("ContextualStateDiffer", () => {
  it("should correctly report structural differences", () => {
    const context: Context = { goal: "Test", active_context: { a: 1, b: "old" } };
    const differ = new ContextualStateDiffer(context);
    const newState: Record<string, any> = { a: 1, b: "new", c: true };

    const diff = differ.diff(newState);

    expect(diff).toHaveLength(2);
    expect(diff.some(d => d.path === "active_context.b" && d.type === "structural")).toBe(true);
    expect(diff.some(d => d.path === "active_context.c" && d.type === "structural")).toBe(true);
  });

  it("should report contextual differences when values change significantly", () => {
    const context: Context = { goal: "Analyze", active_context: { user_id: "u1", last_topic: "weather" } };
    const differ = new ContextualStateDiffer(context);
    const newState: Record<string, any> = { user_id: "u1", last_topic: "finance" };

    const diff = differ.diff(newState);

    expect(diff).toHaveLength(1);
    expect(diff[0].path).toBe("active_context.last_topic");
    expect(diff[0].type).toBe("contextual");
    expect(diff[0].relevanceScore).toBeGreaterThan(0.5);
  });

  it("should report no differences if the state is identical", () => {
    const context: Context = { goal: "Test", active_context: { key: "value", count: 5 } };
    const differ = new ContextualStateDiffer(context);
    const newState: Record<string, any> = { key: "value", count: 5 };

    const diff = differ.diff(newState);

    expect(diff).toHaveLength(0);
  });
});