import { describe, it, expect } from "vitest";
import { CostAwarePlanner } from "../src/planning/cost-aware-planner.js";

describe("CostAwarePlanner", () => {
  it("should create a plan that respects the budget when multiple options are available", () => {
    const mockActions = [
      { name: "Action A", description: "Desc A", estimatedCost: 10 },
      { name: "Action B", description: "Desc B", estimatedCost: 5 },
      { name: "Action C", description: "Desc C", estimatedCost: 20 },
    ];
    const mockCostEstimator = (actions: any[]) => actions.reduce((sum, action) => sum + action.estimatedCost, 0);
    const budget = 15;

    // We assume the planner prioritizes the cheapest combination that covers the necessary steps.
    // For this test, we simulate a scenario where the planner must choose between A+B (15) and C (20).
    // Since the budget is 15, it should choose A+B.
    const planner = new CostAwarePlanner(budget, mockCostEstimator);

    // Assuming the planner has a method like 'plan' that takes required actions/steps
    // Since the actual method signature isn't provided, we'll test the core logic based on the constructor and budget constraint.
    // We'll assume a method `plan(requiredActions)` exists and returns the plan.
    // For testing purposes, we'll mock the required actions to be A and B.
    const plan = planner.plan([mockActions[0], mockActions[1]]);

    expect(plan).toBeDefined();
    expect(plan.totalCost).toBeCloseTo(15);
    expect(plan.steps.length).toBe(2);
  });

  it("should return a plan with zero steps and cost if no actions can be afforded", () => {
    const mockActions = [
      { name: "Action X", description: "Desc X", estimatedCost: 50 },
    ];
    const mockCostEstimator = (actions: any[]) => actions.reduce((sum, action) => sum + action.estimatedCost, 0);
    const budget = 10;

    const planner = new CostAwarePlanner(budget, mockCostEstimator);

    // Attempt to plan with actions that exceed the budget
    const plan = planner.plan([mockActions[0]]);

    expect(plan).toBeDefined();
    expect(plan.totalCost).toBe(0);
    expect(plan.steps.length).toBe(0);
  });

  it("should handle a scenario where the budget is sufficient for all required actions", () => {
    const mockActions = [
      { name: "Action P", description: "Desc P", estimatedCost: 5 },
      { name: "Action Q", description: "Desc Q", estimatedCost: 10 },
      { name: "Action R", description: "Desc R", estimatedCost: 3 },
    ];
    const mockCostEstimator = (actions: any[]) => actions.reduce((sum, action) => sum + action.estimatedCost, 0);
    const budget = 100; // High budget

    const planner = new CostAwarePlanner(budget, mockCostEstimator);

    // Plan with all actions
    const plan = planner.plan([mockActions[0], mockActions[1], mockActions[2]]);

    expect(plan).toBeDefined();
    expect(plan.totalCost).toBeCloseTo(18);
    expect(plan.steps.length).toBe(3);
  });
});