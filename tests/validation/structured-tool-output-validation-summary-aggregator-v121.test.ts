import { describe, it, expect } from "vitest";
import { StructuredSummaryAggregator } from "../src/validation/structured-tool-output-validation-summary-aggregator-v121";

describe("StructuredSummaryAggregator", () => {
  it("should correctly aggregate results when all sources are valid", () => {
    const aggregator = new StructuredSummaryAggregator();
    const results: ValidationResult[] = [
      { sourceId: "source1", isValid: true, errors: [], metadata: {} },
      { sourceId: "source2", isValid: true, errors: [], metadata: {} },
    ];
    const summary = aggregator.aggregate(results, "fail-fast");

    expect(summary.overallSuccess).toBe(true);
    expect(summary.totalSources).toBe(2);
    expect(summary.failedSources).toBe(0);
    expect(summary.weightedConflictScore).toBe(0);
  });

  it("should correctly aggregate results when some sources fail (fail-fast strategy)", () => {
    const aggregator = new StructuredSummaryAggregator();
    const results: ValidationResult[] = [
      { sourceId: "source1", isValid: true, errors: [], metadata: {} },
      { sourceId: "source2", isValid: false, errors: ["Error A"], metadata: {} },
      { sourceId: "source3", isValid: false, errors: ["Error B"], metadata: {} },
    ];
    const summary = aggregator.aggregate(results, "fail-fast");

    expect(summary.overallSuccess).toBe(false);
    expect(summary.totalSources).toBe(3);
    expect(summary.failedSources).toBe(2);
    // In fail-fast, the summary report might reflect the first failure or just a general failure state
    expect(summary.summaryReport).toContain("Failed");
  });

  it("should calculate weighted conflict score correctly when using weighted-average strategy", () => {
    const aggregator = new StructuredSummaryAggregator();
    const results: ValidationResult[] = [
      { sourceId: "source1", isValid: true, errors: [], metadata: { conflictWeight: 0.1 } },
      { sourceId: "source2", isValid: false, errors: ["Conflict"], metadata: { conflictWeight: 0.4 } },
      { sourceId: "source3", isValid: false, errors: ["Conflict"], metadata: { conflictWeight: 0.5 } },
    ];
    // Assuming the score calculation is based on the sum of weights of failed sources for this test case
    const summary = aggregator.aggregate(results, "weighted-average");

    expect(summary.totalSources).toBe(3);
    expect(summary.failedSources).toBe(2);
    // Expected score: 0.4 + 0.5 = 0.9 (This assumes the implementation sums weights of failed sources)
    expect(summary.weightedConflictScore).toBeCloseTo(0.9);
  });
});