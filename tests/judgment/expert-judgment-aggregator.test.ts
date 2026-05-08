import { describe, it, expect } from "vitest";
import { ExpertJudgmentAggregator, JudgmentInput } from "../src/judgment/expert-judgment-aggregator";

describe("ExpertJudgmentAggregator", () => {
  it("should throw an error if initialized with empty inputs", () => {
    expect(() => new ExpertJudgmentAggregator([])).toThrow("Judgment inputs cannot be empty.");
  });

  it("should correctly aggregate scores and calculate confidence for multiple inputs", () => {
    const inputs: JudgmentInput[] = [
      { sourceId: "A", rawScore: 80, confidenceWeight: 0.6, rationale: "Good" },
      { sourceId: "B", rawScore: 90, confidenceWeight: 0.4, rationale: "Better" },
    ];
    const aggregator = new ExpertJudgmentAggregator(inputs);
    // Assuming the aggregation logic calculates a weighted average for score and confidence
    // Weighted Score: (80 * 0.6 + 90 * 0.4) / (0.6 + 0.4) = (48 + 36) / 1 = 84
    // Weighted Confidence: (0.6 * 0.6 + 0.4 * 0.4) / (0.6 + 0.4) = (0.36 + 0.16) / 1 = 0.52
    // Note: The actual implementation details of the aggregation are assumed based on standard practices.
    // We test the expected outcome based on the weighted average calculation.
    const result = aggregator.aggregate();

    expect(result.synthesizedScore).toBeCloseTo(84.0);
    expect(result.confidenceScore).toBeCloseTo(0.52);
    expect(result.report).toContain("Aggregated judgment report");
  });

  it("should handle a single input gracefully", () => {
    const inputs: JudgmentInput[] = [
      { sourceId: "Single", rawScore: 75, confidenceWeight: 1.0, rationale: "Only one source" },
    ];
    const aggregator = new ExpertJudgmentAggregator(inputs);
    const result = aggregator.aggregate();

    expect(result.synthesizedScore).toBeCloseTo(75.0);
    expect(result.confidenceScore).toBeCloseTo(1.0);
  });
});