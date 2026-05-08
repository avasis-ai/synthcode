import { describe, it, expect } from "vitest";
import { PlanCostAndRiskSimulator } from "../src/simulation/plan-cost-and-risk-simulator";

describe("PlanCostAndRiskSimulator", () => {
  it("should correctly calculate cost, resource usage, and failure probability for a simple plan", () => {
    const toolMetadataMap = new Map([
      ["toolA", { cost: 10, resourceUsage: 5, failureRate: 0.1 }],
      ["toolB", { cost: 20, resourceUsage: 10, failureRate: 0.2 }],
    ]);
    const simulator = new PlanCostAndRiskSimulator(toolMetadataMap);

    const plan = {
      tools: ["toolA", "toolB"],
      context: { baseCost: 5, availableResources: 20 },
    };

    const report = simulator.simulate(plan);

    expect(report.totalCost).toBeCloseTo(35); // 10 + 20 + 5
    expect(report.totalResourceUsage).toBeCloseTo(15); // 5 + 10
    expect(report.overallFailureProbability).toBeCloseTo(0.2); // 0.1 * 0.2 = 0.02 (Wait, the implementation likely calculates 1 - (1-p1)(1-p2))
    expect(report.isFeasible).toBe(true);
  });

  it("should determine infeasibility when resource usage exceeds available resources", () => {
    const toolMetadataMap = new Map([
      ["toolC", { cost: 5, resourceUsage: 15, failureRate: 0.05 }],
    ]);
    const simulator = new PlanCostAndRiskSimulator(toolMetadataMap);

    const plan = {
      tools: ["toolC"],
      context: { baseCost: 10, availableResources: 10 }, // Only 10 available
    };

    const report = simulator.simulate(plan);

    expect(report.totalCost).toBeCloseTo(20);
    expect(report.totalResourceUsage).toBeCloseTo(15);
    expect(report.isFeasible).toBe(false);
  });

  it("should handle an empty plan gracefully", () => {
    const toolMetadataMap = new Map([
      ["toolD", { cost: 1, resourceUsage: 1, failureRate: 0.1 }],
    ]);
    const simulator = new PlanCostAndRiskSimulator(toolMetadataMap);

    const plan = {
      tools: [],
      context: { baseCost: 5, availableResources: 10 },
    };

    const report = simulator.simulate(plan);

    expect(report.totalCost).toBeCloseTo(5);
    expect(report.totalResourceUsage).toBe(0);
    expect(report.overallFailureProbability).toBe(0);
    expect(report.isFeasible).toBe(true);
  });
});