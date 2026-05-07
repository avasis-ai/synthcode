import { describe, it, expect } from "vitest";
import { StateReconciliationEngine } from "../src/reconciliation/state-reconciliation-engine.js";

describe("StateReconciliationEngine", () => {
  it("should correctly reconcile state with multiple updates and resolve conflicts", async () => {
    const initialState: { count: number; name: string } = { count: 0, name: "Initial" };
    const engine = new StateReconciliationEngine();

    const updates: Array<{ payload: Partial<{ count: number; name: string }>; sourceID: string; timestamp: number }> = [
      { payload: { count: 1 }, sourceID: "A", timestamp: 100 },
      { payload: { name: "Updated by B" }, sourceID: "B", timestamp: 200 },
      { payload: { count: 5 }, sourceID: "A", timestamp: 300 }, // Conflict on count
    ];

    const report = await engine.reconcile(initialState, updates);

    expect(report.finalState.count).toBe(5);
    expect(report.finalState.name).toBe("Updated by B");
    expect(report.conflictsResolved).toHaveLength(1);
    expect(report.conflictsResolved).toContain("count");
  });

  it("should handle empty updates list without changing the state", async () => {
    const initialState: { count: number; name: string } = { count: 10, name: "Stable" };
    const engine = new StateReconciliationEngine();

    const updates: Array<{ payload: Partial<{ count: number; name: string }>; sourceID: string; timestamp: number }> = [];

    const report = await engine.reconcile(initialState, updates);

    expect(report.finalState).toEqual(initialState);
    expect(report.conflictsResolved).toHaveLength(0);
  });

  it("should prioritize updates based on timestamp when no explicit policy is provided", async () => {
    const initialState: { value: number } = { value: 10 };
    const engine = new StateReconciliationEngine();

    const updates: Array<{ payload: Partial<{ value: number }>; sourceID: string; timestamp: number }> = [
      { payload: { value: 5 }, sourceID: "Low", timestamp: 10 },
      { payload: { value: 20 }, sourceID: "High", timestamp: 30 },
    ];

    const report = await engine.reconcile(initialState, updates);

    // Expect the highest timestamp (30) to win
    expect(report.finalState.value).toBe(20);
    expect(report.conflictsResolved).toHaveLength(1);
  });
});