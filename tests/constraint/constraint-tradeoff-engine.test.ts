import { describe, it, expect } from "vitest";
import { ConstraintTradeoffEngine, Constraint } from "../src/constraint/constraint-tradeoff-engine";

describe("ConstraintTradeoffEngine", () => {
  it("should calculate initial goal score correctly based on constraints", () => {
    const engine = new ConstraintTradeoffEngine();
    const constraints: Constraint[] = [
      { name: "Latency", type: "max", targetValue: 100, description: "Max latency" },
      { name: "Cost", type: "min", targetValue: 50, description: "Min cost" },
    ];
    const score = engine.calculateInitialGoalScore(constraints);
    expect(score).toBeGreaterThan(0);
  });

  it("should calculate weighted tradeoff payload when relaxing constraints", () => {
    const engine = new ConstraintTradeoffEngine();
    const constraints: Constraint[] = [
      { name: "Latency", type: "max", targetValue: 100, description: "Max latency" },
      { name: "Cost", type: "min", targetValue: 50, description: "Min cost" },
    ];
    const relaxedConstraints: Record<string, { relaxed: boolean; weight: number; reason: string }> = {
      "Latency": { relaxed: true, weight: 0.5, reason: "High latency observed" },
      "Cost": { relaxed: false, weight: 1.0, reason: "" },
    };
    const payload = engine.calculateTradeoffPayload(constraints, relaxedConstraints);
    expect(payload.overallGoalScore).toBeCloseTo(100); // Assuming a specific calculation logic
    expect(payload.constraints).toHaveProperty("Latency");
    expect(payload.constraints).toHaveProperty("Cost");
  });

  it("should handle empty constraints list gracefully", () => {
    const engine = new ConstraintTradeoffEngine();
    const constraints: Constraint[] = [];
    const relaxedConstraints: Record<string, { relaxed: boolean; weight: number; reason: string }> = {};
    const payload = engine.calculateTradeoffPayload(constraints, relaxedConstraints);
    expect(payload.overallGoalScore).toBe(0);
    expect(payload.constraints).toEqual({});
  });
});