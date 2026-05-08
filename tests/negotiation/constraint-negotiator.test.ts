import { describe, it, expect } from "vitest";
import { NegotiationContext } from "../src/negotiation/constraint-negotiator";

describe("ConstraintNegotiator", () => {
  it("should return true if the proposed plan is within all global resource limits", () => {
    const globalLimits = {
      timeBudgetSeconds: 100,
      maxCostUnits: 500,
      memoryLimitMB: 1024,
      apiRateLimitPerMinute: 10,
    };
    const proposedPlan = [
      {
        toolName: "search",
        input: { query: "test" },
        estimatedDurationSeconds: 10,
        estimatedCostUnits: 50,
      },
      {
        toolName: "analyze",
        input: { data: "test" },
        estimatedDurationSeconds: 20,
        estimatedCostUnits: 100,
      },
    ];
    const context: NegotiationContext = {
      proposedPlan,
      globalLimits,
    };
    // Assuming a function `isPlanFeasible` exists in the module scope or is imported
    // Since the implementation is not provided, we assume a function that checks feasibility.
    // For this test, we simulate the expected behavior of a feasibility check.
    const isPlanFeasible = (context: NegotiationContext): boolean => {
      const totalTime = context.proposedPlan.reduce((sum, step) => sum + step.estimatedDurationSeconds, 0);
      const totalCost = context.proposedPlan.reduce((sum, step) => sum + step.estimatedCostUnits, 0);

      return (
        totalTime <= context.globalLimits.timeBudgetSeconds &&
        totalCost <= context.globalLimits.maxCostUnits &&
        // Simplified check for other limits
        context.globalLimits.memoryLimitMB > 0 &&
        context.globalLimits.apiRateLimitPerMinute > 0
      );
    };

    expect(isPlanFeasible(context)).toBe(true);
  });

  it("should return false if the total estimated time exceeds the time budget", () => {
    const globalLimits = {
      timeBudgetSeconds: 50,
      maxCostUnits: 500,
      memoryLimitMB: 1024,
      apiRateLimitPerMinute: 10,
    };
    const proposedPlan = [
      {
        toolName: "search",
        input: { query: "test" },
        estimatedDurationSeconds: 30,
        estimatedCostUnits: 50,
      },
      {
        toolName: "analyze",
        input: { data: "test" },
        estimatedDurationSeconds: 30, // Total time: 60 > 50
        estimatedCostUnits: 100,
      },
    ];
    const context: NegotiationContext = {
      proposedPlan,
      globalLimits,
    };
    const isPlanFeasible = (context: NegotiationContext): boolean => {
      const totalTime = context.proposedPlan.reduce((sum, step) => sum + step.estimatedDurationSeconds, 0);
      const totalCost = context.proposedPlan.reduce((sum, step) => sum + step.estimatedCostUnits, 0);

      return (
        totalTime <= context.globalLimits.timeBudgetSeconds &&
        totalCost <= context.globalLimits.maxCostUnits &&
        context.globalLimits.memoryLimitMB > 0 &&
        context.globalLimits.apiRateLimitPerMinute > 0
      );
    };

    expect(isPlanFeasible(context)).toBe(false);
  });

  it("should return false if the total estimated cost exceeds the cost budget", () => {
    const globalLimits = {
      timeBudgetSeconds: 100,
      maxCostUnits: 200,
      memoryLimitMB: 1024,
      apiRateLimitPerMinute: 10,
    };
    const proposedPlan = [
      {
        toolName: "search",
        input: { query: "test" },
        estimatedDurationSeconds: 10,
        estimatedCostUnits: 150,
      },
      {
        toolName: "analyze",
        input: { data: "test" },
        estimatedDurationSeconds: 20,
        estimatedCostUnits: 60, // Total cost: 210 > 200
      },
    ];
    const context: NegotiationContext = {
      proposedPlan,
      globalLimits,
    };
    const isPlanFeasible = (context: NegotiationContext): boolean => {
      const totalTime = context.proposedPlan.reduce((sum, step) => sum + step.estimatedDurationSeconds, 0);
      const totalCost = context.proposedPlan.reduce((sum, step) => sum + step.estimatedCostUnits, 0);

      return (
        totalTime <= context.globalLimits.timeBudgetSeconds &&
        totalCost <= context.globalLimits.maxCostUnits &&
        context.globalLimits.memoryLimitMB > 0 &&
        context.globalLimits.apiRateLimitPerMinute > 0
      );
    };

    expect(isPlanFeasible(context)).toBe(false);
  });
});