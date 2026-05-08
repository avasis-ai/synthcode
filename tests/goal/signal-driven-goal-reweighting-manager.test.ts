import { describe, it, expect, vi } from "vitest";
import { GoalReweightingManager } from "../src/goal/signal-driven-goal-reweighting-manager";
import { Signal, Goal } from "../src/goal/signal-driven-goal-reweighting-manager";

describe("GoalReweightingManager", () => {
  it("should initialize with a set of goals and correctly calculate initial weights", () => {
    const goals: Goal[] = [
      { id: "g1", name: "Speed Goal", baseWeight: 0.5 },
      { id: "g2", name: "Accuracy Goal", baseWeight: 0.3 },
      { id: "g3", name: "Safety Goal", baseWeight: 0.2 },
    ];
    const manager = new GoalReweightingManager(goals);

    // Check if the internal state reflects the initial weights
    expect(manager.getGoalWeights()).toEqual({
      "g1": 0.5,
      "g2": 0.3,
      "g3": 0.2,
    });
  });

  it("should adjust goal weights based on a high-severity signal", () => {
    const goals: Goal[] = [
      { id: "g_speed", name: "Speed", baseWeight: 0.5 },
      { id: "g_safety", name: "Safety", baseWeight: 0.5 },
    ];
    const manager = new GoalReweightingManager(goals);

    // Simulate a high-impact, high-severity signal related to safety
    const safetySignal: Signal = {
      source: "system_monitor",
      type: "critical_failure",
      severity: "high",
      impact: 0.9,
      description: "Safety system detected critical failure.",
    };

    // The manager should increase the weight of the affected goal (safety)
    manager.processSignal(safetySignal);

    // Check if the safety goal weight increased significantly
    const weights = manager.getGoalWeights();
    expect(weights["g_safety"]).toBeGreaterThan(0.5);
    // Check if the other goal weight decreased proportionally (or at least didn't increase)
    expect(weights["g_speed"]).toBeLessThan(0.5);
  });

  it("should dampen weight adjustments for low-severity signals", () => {
    const goals: Goal[] = [
      { id: "g_accuracy", name: "Accuracy", baseWeight: 1.0 },
    ];
    const manager = new GoalReweightingManager(goals);

    // Simulate a low-impact, low-severity signal
    const lowSignal: Signal = {
      source: "user_input",
      type: "minor_adjustment",
      severity: "low",
      impact: 0.1,
      description: "User made minor input correction.",
    };

    // Process the low signal
    manager.processSignal(lowSignal);

    // The weight should change minimally, staying close to the base weight
    const weights = manager.getGoalWeights();
    expect(weights["g_accuracy"]).toBeCloseTo(1.0, 0.05);
  });
});