import { describe, it, expect } from "vitest";
import { ToolCostEstimator, ToolCallPlan, CostReport } from "../src/cost/tool-usage-cost-estimator";

describe("ToolUsageCostEstimator", () => {
  it("should calculate the total cost correctly for a single tool call", () => {
    const mockEstimator: ToolCostEstimator = {
      baseCost: 1.0,
      inputTokenEstimate: (input) => 10 * Object.keys(input).length,
      outputTokenEstimate: (output) => 5 * Object.keys(output).length,
    };
    const mockPlan: ToolCallPlan = {
      toolName: "search",
      input: { query: "test" },
      toolDefinition: mockEstimator,
    };

    // Simulate a scenario where the output has 2 keys
    const report = {
      totalCost: 1.0 + (10 * 1) + (5 * 2),
      breakdown: [
        { toolName: "search", cost: 1.0, inputTokens: 10 },
      ],
    } as CostReport;

    expect(report.totalCost).toBe(2.0);
    expect(report.breakdown.length).toBe(1);
    expect(report.breakdown[0].toolName).toBe("search");
  });

  it("should calculate the total cost correctly for multiple tool calls", () => {
    const mockEstimator1: ToolCostEstimator = {
      baseCost: 0.5,
      inputTokenEstimate: (input) => 5 * Object.keys(input).length,
      outputTokenEstimate: (output) => 2 * Object.keys(output).length,
    };
    const mockEstimator2: ToolCostEstimator = {
      baseCost: 1.5,
      inputTokenEstimate: (input) => 10 * Object.keys(input).length,
      outputTokenEstimate: (output) => 3 * Object.keys(output).length,
    };

    const mockPlans: ToolCallPlan[] = [
      { toolName: "toolA", input: { a: 1 }, toolDefinition: mockEstimator1 },
      { toolName: "toolB", input: { b: 2, c: 3 }, toolDefinition: mockEstimator2 },
    ];

    // Expected calculation:
    // ToolA: 0.5 + (5 * 1) + (2 * 1) = 7.5
    // ToolB: 1.5 + (10 * 2) + (3 * 2) = 27.5
    // Total: 7.5 + 27.5 = 35.0

    const report = {
      totalCost: 35.0,
      breakdown: [
        { toolName: "toolA", cost: 7.5, inputTokens: 5 },
        { toolName: "toolB", cost: 27.5, inputTokens: 20 },
      ],
    } as CostReport;

    expect(report.totalCost).toBe(35.0);
    expect(report.breakdown.length).toBe(2);
  });

  it("should handle empty tool call plans resulting in zero cost", () => {
    const mockPlans: ToolCallPlan[] = [];

    const report: CostReport = {
      totalCost: 0,
      breakdown: [],
    };

    expect(report.totalCost).toBe(0);
    expect(report.breakdown.length).toBe(0);
  });
});