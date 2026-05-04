import { describe, it, expect } from "vitest";
import { ContextualStateDiffer } from "../src/context/contextual-state-diffing-v102";

describe("ContextualStateDiffer", () => {
  it("should calculate a low difference for identical states", () => {
    const differ = new ContextualStateDiffer();
    const state1: Record<string, any> = { count: 1, data: "hello" };
    const state2: Record<string, any> = { count: 1, data: "hello" };
    const snapshot1: StateSnapshot = { state: state1, timestamp: 1000 };
    const snapshot2: StateSnapshot = { state: state2, timestamp: 1001 };

    const report = differ.calculateDiff(snapshot1, snapshot2);

    expect(report.structuralDiff).toEqual({});
    expect(report.semanticScore).toBeCloseTo(0);
    expect(report.temporalWeight).toBeCloseTo(0);
    expect(report.overallContextualDifference).toBeCloseTo(0);
  });

  it("should calculate a high difference for significantly changed states", () => {
    const differ = new ContextualStateDiffer();
    const state1: Record<string, any> = { count: 1, data: "initial" };
    const state2: Record<string, any> = { count: 100, data: "completely changed" };
    const snapshot1: StateSnapshot = { state: state1, timestamp: 1000 };
    const snapshot2: StateSnapshot = { state: state2, timestamp: 1001 };

    const report = differ.calculateDiff(snapshot1, snapshot2);

    expect(report.structuralDiff).not.toEqual({});
    expect(report.semanticScore).toBeGreaterThan(0.5);
    expect(report.temporalWeight).toBeGreaterThan(0);
    expect(report.overallContextualDifference).toBeGreaterThan(0.5);
  });

  it("should account for temporal difference when states are otherwise similar", () => {
    const differ = new ContextualStateDiffer();
    const state1: Record<string, any> = { user: "A", session: "X" };
    const state2: Record<string, any> = { user: "A", session: "X" };
    const snapshot1: StateSnapshot = { state: state1, timestamp: 1000 };
    const snapshot2: StateSnapshot = { state: state2, timestamp: 2000 }; // Larger time gap

    const report = differ.calculateDiff(snapshot1, snapshot2);

    // Expect a non-zero temporal weight due to the time difference
    expect(report.temporalWeight).toBeGreaterThan(0);
    // Expect the overall difference to be influenced by time
    expect(report.overallContextualDifference).toBeGreaterThan(0.01);
  });
});