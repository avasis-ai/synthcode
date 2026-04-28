import { describe, it, expect } from "vitest";
import { CostProjector, CostProjection } from "../src/cost/tool-usage-cost-projection";
import { PricingModel } from "../src/cost/pricing-model";
import { ToolCallDefinition } from "../src/cost/tool-call-definition";

describe("CostProjector", () => {
  it("should calculate the total cost for a single tool call correctly", () => {
    const pricingModel = {
      inputTokenCost: 0.001,
      outputTokenCost: 0.001,
      toolCallCost: 0.01,
    };
    const toolCall: ToolCallDefinition = {
      name: "search",
      input: "test query",
      output: "search result",
    };
    const projection: CostProjection = {
      toolCalls: [toolCall],
      pricingModel: pricingModel,
    };

    const projector = new CostProjector(pricingModel);
    const totalCost = projector.projectCost(projection);

    expect(totalCost).toBeCloseTo(0.01 + (10 * 0.001) + (20 * 0.001), 5);
  });

  it("should calculate the total cost for multiple tool calls", () => {
    const pricingModel = {
      inputTokenCost: 0.001,
      outputTokenCost: 0.001,
      toolCallCost: 0.01,
    };
    const toolCall1: ToolCallDefinition = {
      name: "search",
      input: "query one",
      output: "result one",
    };
    const toolCall2: ToolCallDefinition = {
      name: "weather",
      input: "query two",
      output: "result two",
    };
    const projection: CostProjection = {
      toolCalls: [toolCall1, toolCall2],
      pricingModel: pricingModel,
    };

    const projector = new CostProjector(pricingModel);
    const totalCost = projector.projectCost(projection);

    // Expected cost: 2 * toolCallCost + (2 * inputTokens * inputTokenCost) + (2 * outputTokens * outputTokenCost)
    // Assuming input/output token counts are proportional to string length for simplicity in this test setup.
    // Let's use explicit token counts for better testing if available, but based on the structure, we'll assume the method handles it.
    // For this test, we'll assume the cost calculation is additive for each call.
    const expectedCost = (2 * 0.01) + (2 * 0.001) + (2 * 0.001);
    expect(totalCost).toBeCloseTo(expectedCost, 5);
  });

  it("should return zero cost for no tool calls", () => {
    const pricingModel = {
      inputTokenCost: 0.001,
      outputTokenCost: 0.001,
      toolCallCost: 0.01,
    };
    const projection: CostProjection = {
      toolCalls: [],
      pricingModel: pricingModel,
    };

    const projector = new CostProjector(pricingModel);
    const totalCost = projector.projectCost(projection);

    expect(totalCost).toBe(0);
  });
});