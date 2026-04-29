import { describe, it, expect } from "vitest";
import { StructuredToolOutputValidationSummaryAggregator } from "../src/validation/structured-tool-output-validation-summary-aggregator-v137";

describe("StructuredToolOutputValidationSummaryAggregator", () => {
  it("should calculate correct summary when all entries are INFO", () => {
    const aggregator = new StructuredToolOutputValidationSummaryAggregator();
    const entries = [
      { severity: "INFO", description: "Info 1", contextTags: ["tagA"], weight: 1 },
      { severity: "INFO", description: "Info 2", contextTags: ["tagB"], weight: 1 },
    ];
    const summary = aggregator.aggregate(entries);

    expect(summary.overallScore).toBe(1.0);
    expect(summary.action).toBe("PASS");
    expect(summary.weightedFailureCount).toBe(0);
  });

  it("should prioritize CRITICAL severity and calculate weighted failure count correctly", () => {
    const aggregator = new StructuredToolOutputValidationSummaryAggregator();
    const entries = [
      { severity: "WARNING", description: "Warning", contextTags: ["tagW"], weight: 2 },
      { severity: "CRITICAL", description: "Critical Failure", contextTags: ["tagC"], weight: 3 },
      { severity: "ERROR", description: "Error", contextTags: ["tagE"], weight: 1 },
    ];
    const summary = aggregator.aggregate(entries);

    expect(summary.overallScore).toBeLessThan(1.0); // Should be lower than perfect
    expect(summary.action).toBe("FAIL");
    expect(summary.weightedFailureCount).toBe(3); // Only CRITICAL contributes to failure count based on typical logic
  });

  it("should result in WARN action if only WARNINGs are present", () => {
    const aggregator = new StructuredToolOutputValidationSummaryAggregator();
    const entries = [
      { severity: "WARNING", description: "Warning 1", contextTags: ["tagA"], weight: 1 },
      { severity: "WARNING", description: "Warning 2", contextTags: ["tagB"], weight: 1 },
    ];
    const summary = aggregator.aggregate(entries);

    expect(summary.overallScore).toBeLessThan(1.0);
    expect(summary.action).toBe("WARN");
    expect(summary.weightedFailureCount).toBe(0); // Assuming only CRITICAL/ERROR count towards failure count
  });
});