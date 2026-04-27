import { describe, it, expect } from "vitest";
import { ToolUsageCostEstimator } from "../src/cost/tool-usage-estimator";
import { ToolDefinition } from "../src/cost/tool-definitions";

describe("ToolUsageCostEstimator", () => {
  it("should calculate cost correctly with provided tool definitions", () => {
    const mockToolDefinitions: ToolDefinition[] = [
      { name: "search", inputCost: 0.01, outputCost: 0.02 },
      { name: "calculator", inputCost: 0.005, outputCost: 0.01 },
    ];
    const estimator = new ToolUsageCostEstimator(mockToolDefinitions, 10);

    const toolCalls = [
      { name: "search", inputTokens: 100, outputTokens: 50 },
      { name: "calculator", inputTokens: 20, outputTokens: 10 },
    ];

    const estimate = estimator.estimateCost(toolCalls);

    expect(estimate.inputTokens).toBe(120);
    expect(estimate.outputTokens).toBe(60);
    // Expected cost: (100*0.01 + 20*0.005) + (50*0.02 + 10*0.01) * 10
    // Input: 1.0 + 0.1 = 1.1
    // Output: (1.0 + 0.1) * 10 = 11.0
    // Total: 1.1 + 11.0 = 12.1
    expect(estimate.totalCost).toBeCloseTo(12.1, 2);
  });

  it("should return zero cost when no tool calls are provided", () => {
    const mockToolDefinitions: ToolDefinition[] = [
      { name: "search", inputCost: 0.01, outputCost: 0.02 },
    ];
    const estimator = new ToolUsageCostEstimator(mockToolDefinitions);

    const toolCalls: any[] = [];
    const estimate = estimator.estimateCost(toolCalls);

    expect(estimate.inputTokens).toBe(0);
    expect(estimate.outputTokens).toBe(0);
    expect(estimate.totalCost).toBe(0);
  });

  it("should handle an empty tool definition list gracefully", () => {
    const mockToolDefinitions: ToolDefinition[] = [];
    const estimator = new ToolUsageCostEstimator(mockToolDefinitions);

    const toolCalls = [
      { name: "unknown_tool", inputTokens: 10, outputTokens: 10 },
    ];
    const estimate = estimator.estimateCost(toolCalls);

    expect(estimate.inputTokens).toBe(0);
    expect(estimate.outputTokens).toBe(0);
    expect(estimate.totalCost).toBe(0);
  });
});