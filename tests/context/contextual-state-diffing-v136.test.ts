import { describe, it, expect } from "vitest";
import { ContextualStateDiffer } from "../src/context/contextual-state-diffing-v136";

describe("ContextualStateDiffer", () => {
  it("should calculate a basic diff when state changes significantly", () => {
    const initialConstraint = { decayRate: 0.1, resourceWeight: { user: 1, assistant: 1 } };
    const differ = new ContextualStateDiffer(initialConstraint);

    const oldState = {
      messages: [{ role: "user", content: "Hello" }],
      metadata: { session_id: "abc" },
    };
    const newState = {
      messages: [{ role: "user", content: "Hello" }, { role: "assistant", content: "Hi there" }],
      metadata: { session_id: "abc", turn_count: 2 },
    };

    const report = differ.calculateDiff(oldState, newState);

    expect(report.diff).toHaveProperty("messages");
    expect(report.diff).toHaveProperty("metadata");
    expect(report.decayImpactScore).toBeGreaterThanOrEqual(0);
    expect(report.resourceOverheadScore).toBeGreaterThanOrEqual(0);
    expect(report.isSignificantDrift).toBe(true);
  });

  it("should report minimal drift when state changes slightly", () => {
    const initialConstraint = { decayRate: 0.1, resourceWeight: { user: 1, assistant: 1 } };
    const differ = new ContextualStateDiffer(initialConstraint);

    const oldState = {
      messages: [{ role: "user", content: "Initial" }],
      metadata: { session_id: "xyz", turn_count: 1 },
    };
    const newState = {
      messages: [{ role: "user", content: "Initial" }],
      metadata: { session_id: "xyz", turn_count: 1 },
    };

    const report = differ.calculateDiff(oldState, newState);

    expect(report.diff).toEqual({});
    expect(report.decayImpactScore).toBeCloseTo(0);
    expect(report.resourceOverheadScore).toBeCloseTo(0);
    expect(report.isSignificantDrift).toBe(false);
  });

  it("should detect drift when a critical resource changes", () => {
    const initialConstraint = { decayRate: 0.1, resourceWeight: { user: 1, assistant: 1 } };
    const differ = new ContextualStateDiffer(initialConstraint);

    const oldState = {
      messages: [{ role: "user", content: "Test" }],
      metadata: { session_id: "test", turn_count: 1 },
    };
    const newState = {
      messages: [{ role: "user", content: "Test" }],
      metadata: { session_id: "test", turn_count: 1, critical_flag: true },
    };

    const report = differ.calculateDiff(oldState, newState);

    expect(report.diff).toHaveProperty("metadata");
    expect(report.diff.metadata).toHaveProperty("critical_flag");
    expect(report.isSignificantDrift).toBe(true);
  });
});