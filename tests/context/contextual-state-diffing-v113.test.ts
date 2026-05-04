import { describe, it, expect } from "vitest";
import { ContextualStateDiffer, TemporalResourceConstraint, StateDiff } from "../src/context/contextual-state-diffing-v113";

describe("ContextualStateDiffer", () => {
  it("should correctly calculate state diff when no changes occur", () => {
    const constraint: TemporalResourceConstraint = { timeWindowMs: 1000, maxResourceUsage: 50 };
    const differ = new ContextualStateDiffer(constraint);

    const previousState: Record<string, any> = {
      user: "Alice",
      messages: [{ type: "text", content: "Hello" }],
    };
    const currentState: Record<string, any> = {
      user: "Alice",
      messages: [{ type: "text", content: "Hello" }],
    };

    const diff: StateDiff = differ.diff(previousState, currentState);

    expect(diff.dataDiff).toEqual({});
    expect(diff.temporalViolation).toBe(false);
    expect(diff.resourceViolation).toBe(false);
    expect(diff.details).toEqual([]);
  });

  it("should detect data changes and report them", () => {
    const constraint: TemporalResourceConstraint = { timeWindowMs: 1000, maxResourceUsage: 50 };
    const differ = new ContextualStateDiffer(constraint);

    const previousState: Record<string, any> = {
      user: "Alice",
      messages: [{ type: "text", content: "Hello" }],
    };
    const currentState: Record<string, any> = {
      user: "Bob",
      messages: [{ type: "text", content: "Hello" }],
    };

    const diff: StateDiff = differ.diff(previousState, currentState);

    expect(diff.dataDiff).toEqual({ user: "Bob" });
    expect(diff.temporalViolation).toBe(false);
    expect(diff.resourceViolation).toBe(false);
    expect(diff.details).toHaveLength(1);
    expect(diff.details[0]).toContain("user");
  });

  it("should report temporal and resource violations when constraints are exceeded", () => {
    const constraint: TemporalResourceConstraint = { timeWindowMs: 100, maxResourceUsage: 10 };
    const differ = new ContextualStateDiffer(constraint);

    const previousState: Record<string, any> = {
      timestamp: Date.now() - 200,
      resourceUsage: 5,
    };
    const currentState: Record<string, any> = {
      timestamp: Date.now(),
      resourceUsage: 20,
    };

    // Mocking time difference to ensure violation detection logic is tested
    // In a real scenario, the diff method would handle this based on actual time.
    // For this test, we assume the state structure allows us to test the violation flags.
    // We will rely on the implementation details that check these fields.

    // Since we cannot easily mock time differences without knowing the internal implementation,
    // we test the structure assuming the method correctly flags violations based on input state.
    // We simulate a scenario where both are violated.
    const diff: StateDiff = differ.diff(previousState, currentState);

    // Assuming the implementation correctly detects the resource violation based on the state change
    expect(diff.resourceViolation).toBe(true);
    expect(diff.temporalViolation).toBe(true);
    expect(diff.details).toHaveLength(2);
  });
});