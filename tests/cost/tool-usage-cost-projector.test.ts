import { describe, it, expect } from "vitest";
import { CostProjectionReques } from "../src/cost/tool-usage-cost-projector";

describe("CostProjectionReques", () => {
  it("should correctly calculate cost for a simple message exchange", () => {
    const mockModelPricing: any = {
      getCost: (modelName: string, inputTokens: number, outputTokens: number) => ({
        cost: 0.01 * (inputTokens + outputTokens) / 1000,
        tokens: { input: inputTokens, output: outputTokens },
      }),
    };
    const projector = new CostProjectionReques(mockModelPricing, null);

    const request = {
      messages: [
        { role: "user", content: "Hello" } as any,
        { role: "assistant", content: "Hi there!" } as any,
      ],
    };

    const projection = projector.project(request);

    expect(projection.totalCost).toBeCloseTo(0.0002);
    expect(projection.totalTokens).toEqual({ input: 20, output: 20 });
  });

  it("should handle multiple tool use and message types", () => {
    const mockModelPricing: any = {
      getCost: (modelName: string, inputTokens: number, outputTokens: number) => ({
        cost: 0.01 * (inputTokens + outputTokens) / 1000,
        tokens: { input: inputTokens, output: outputTokens },
      }),
    };
    const mockToolUsageEstimator: any = {
      estimateCost: (toolName: string, input: Record<string, unknown>) => ({
        cost: 0.005,
        tokens: { input: 10, output: 0 },
      }),
    };
    const projector = new CostProjectionReques(mockModelPricing, mockToolUsageEstimator);

    const request = {
      messages: [
        { role: "user", content: "Use tool A" } as any,
        { role: "assistant", toolUse: { toolName: "toolA", toolUse: "some_input" } } as any,
        { role: "tool", toolResultMessage: { toolName: "toolA", content: "result" } } as any,
      ],
    };

    const projection = projector.project(request);

    expect(projection.totalCost).toBeCloseTo(0.01);
    expect(projection.totalTokens).toEqual({ input: 30, output: 10 });
  });

  it("should return zero cost and tokens for an empty message history", () => {
    const mockModelPricing: any = {
      getCost: (modelName: string, inputTokens: number, outputTokens: number) => ({
        cost: 0,
        tokens: { input: 0, output: 0 },
      }),
    };
    const projector = new CostProjectionReques(mockModelPricing, null);

    const request = {
      messages: [] as any[],
    };

    const projection = projector.project(request);

    expect(projection.totalCost).toBe(0);
    expect(projection.totalTokens).toEqual({ input: 0, output: 0 });
  });
});