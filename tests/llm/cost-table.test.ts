import { describe, it, expect } from "vitest";
import { estimateRequestCost, MODEL_COSTS } from "../../src/llm/cost-table.js";

describe("estimateRequestCost", () => {
  it("returns correct cost for gpt-4o", () => {
    const cost = estimateRequestCost("gpt-4o", 1_000_000, 1_000_000);
    expect(cost).toBeCloseTo(2.50 + 10.00, 6);
  });

  it("returns correct cost for gpt-4o-mini", () => {
    const cost = estimateRequestCost("gpt-4o-mini", 1_000_000, 1_000_000);
    expect(cost).toBeCloseTo(0.15 + 0.60, 6);
  });

  it("returns correct cost for claude-sonnet-4-20250514", () => {
    const cost = estimateRequestCost("claude-sonnet-4-20250514", 1_000_000, 1_000_000);
    expect(cost).toBeCloseTo(3.00 + 15.00, 6);
  });

  it("returns correct cost for claude-haiku-3-5-20241022", () => {
    const cost = estimateRequestCost("claude-haiku-3-5-20241022", 1_000_000, 1_000_000);
    expect(cost).toBeCloseTo(0.80 + 4.00, 6);
  });

  it("returns correct cost for partial token usage", () => {
    const cost = estimateRequestCost("gpt-4o", 500_000, 250_000);
    expect(cost).toBeCloseTo(1.25 + 2.50, 6);
  });

  it("returns 0 for zero tokens", () => {
    expect(estimateRequestCost("gpt-4o", 0, 0)).toBe(0);
  });

  it("returns 0 for unknown models", () => {
    expect(estimateRequestCost("nonexistent-model", 1000, 1000)).toBe(0);
  });

  it("returns 0 for local models (qwen2.5-coder:7b)", () => {
    expect(estimateRequestCost("qwen2.5-coder:7b", 1_000_000, 1_000_000)).toBe(0);
  });

  it("costs are positive for known paid models", () => {
    for (const [model, cost] of Object.entries(MODEL_COSTS)) {
      if (cost.inputPer1M > 0 || cost.outputPer1M > 0) {
        expect(estimateRequestCost(model, 1000, 1000)).toBeGreaterThan(0);
      }
    }
  });
});
