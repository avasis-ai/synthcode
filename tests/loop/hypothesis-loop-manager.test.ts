import { describe, it, expect, vi } from "vitest";
import { HypothesisLoopManager } from "../src/loop/hypothesis-loop-manager";

describe("HypothesisLoopManager", () => {
  it("should initialize correctly with required dependencies", async () => {
    const mockEngine = {
      generateSteps: vi.fn(),
    };
    const manager = new HypothesisLoopManager(mockEngine);
    expect(manager).toBeDefined();
  });

  it("should generate an initial test plan when provided a goal and hypothesis", async () => {
    const mockEngine = {
      generateSteps: vi.fn().mockResolvedValue(["step 1", "step 2"]),
    };
    const manager = new HypothesisLoopManager(mockEngine);
    const goal = "Find the best coffee shop.";
    const hypothesis = {
      id: "h1",
      statement: "The best coffee shop is near the park.",
      confidenceScore: 0.8,
      testableSteps: ["Check park area"],
    };

    const testPlan = await manager.createTestPlan(goal, hypothesis);

    expect(testPlan).toHaveProperty("steps");
    expect(testPlan.steps).toEqual(["step 1", "step 2"]);
    expect(testPlan.refinedHypothesis).toBeDefined();
  });

  it("should update the hypothesis and generate a new test plan based on simulation results", async () => {
    const mockEngine = {
      generateSteps: vi.fn()
        .mockResolvedValueOnce(["step 1", "step 2"]) // First call (initial plan)
        .mockResolvedValueOnce(["step 3", "step 4"]), // Second call (refined plan)
    };
    const manager = new HypothesisLoopManager(mockEngine);
    const goal = "Find the best coffee shop.";
    const initialHypothesis = {
      id: "h1",
      statement: "The best coffee shop is near the park.",
      confidenceScore: 0.8,
      testableSteps: ["Check park area"],
    };
    const simulationResult = {
      result: "Found a great shop, but it's across the river.",
      confidenceAdjustment: -0.1,
    };

    // 1. Create initial plan
    await manager.createTestPlan(goal, initialHypothesis);

    // 2. Update plan based on results
    const updatedPlan = await manager.updateTestPlan(
      goal,
      initialHypothesis,
      simulationResult,
    );

    expect(mockEngine.generateSteps).toHaveBeenCalledTimes(2);
    expect(updatedPlan.steps).toEqual(["step 3", "step 4"]);
    expect(updatedPlan.refinedHypothesis.confidenceScore).toBeCloseTo(0.7);
  });
});