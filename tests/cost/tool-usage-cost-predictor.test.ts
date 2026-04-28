import { describe, it, expect } from "vitest";
import { ToolUsageCostPredictor } from "../src/cost/tool-usage-cost-predictor";
import { Message } from "../src/types";

describe("ToolUsageCostPredictor", () => {
  it("should calculate the correct cost for a simple tool call", async () => {
    const predictor = new ToolUsageCostPredictor(/* mock dependencies */);
    const toolCallPlan = {
      toolCalls: [{ name: "search", input: { query: "test" } }],
      messages: [
        { role: "user", content: "What is the weather?" },
      ],
    };

    const costEstimate = await predictor.predictCost(toolCallPlan);

    expect(costEstimate.totalCost).toBeGreaterThan(0);
    expect(costEstimate.breakdown.length).toBeGreaterThanOrEqual(1);
  });

  it("should handle multiple tool calls and messages", async () => {
    const predictor = new ToolUsageCostPredictor(/* mock dependencies */);
    const toolCallPlan = {
      toolCalls: [
        { name: "search", input: { query: "apple" } },
        { name: "weather", input: { city: "London" } },
      ],
      messages: [
        { role: "user", content: "Tell me about apples and the weather in London." },
        { role: "assistant", content: "Here is the info." },
      ],
    };

    const costEstimate = await predictor.predictCost(toolCallPlan);

    expect(costEstimate.totalCost).toBeGreaterThan(0);
    expect(costEstimate.breakdown.length).toBeGreaterThanOrEqual(2);
  });

  it("should return zero cost for empty input", async () => {
    const predictor = new ToolUsageCostPredictor(/* mock dependencies */);
    const toolCallPlan = {
      toolCalls: [],
      messages: [],
    };

    const costEstimate = await predictor.predictCost(toolCallPlan);

    expect(costEstimate.totalCost).toBe(0);
    expect(costEstimate.breakdown).toEqual([]);
  });
});