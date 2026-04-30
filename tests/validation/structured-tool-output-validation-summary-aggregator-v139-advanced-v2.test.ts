import { describe, it, expect } from "vitest";
import {
  StructuredToolOutputValidationSummaryAggregatorV139AdvancedV2,
} from "../src/validation/structured-tool-output-validation-summary-aggregator-v139-advanced-v2";

describe("StructuredToolOutputValidationSummaryAggregatorV139AdvancedV2", () => {
  it("should correctly aggregate validation summaries from multiple sources", async () => {
    const aggregator = new StructuredToolOutputValidationSummaryAggregatorV139AdvancedV2();
    const summary1 = {
      failures: [{
        path: "fieldA",
        description: "A is invalid",
        severity: "ERROR",
        context: "context1",
      }],
      severityWeight: 5,
      contextRelevanceScore: 0.8,
    };
    const summary2 = {
      failures: [{
        path: "fieldB",
        description: "B is missing",
        severity: "WARNING",
        context: "context2",
      }],
      severityWeight: 2,
      contextRelevanceScore: 0.5,
    };

    const combinedSummary = await aggregator.aggregateSummaries([
      summary1,
      summary2,
    ]);

    expect(combinedSummary.totalFailureCount).toBe(2);
    expect(combinedSummary.aggregatedFailures.length).toBe(2);
    expect(combinedSummary.aggregatedFailures).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ path: "fieldA", description: "A is invalid", severity: "ERROR" }),
        expect.objectContaining({ path: "fieldB", description: "B is missing", severity: "WARNING" }),
      ]),
    );
  });

  it("should handle an empty list of summaries gracefully", async () => {
    const aggregator = new StructuredToolOutputValidationSummaryAggregatorV139AdvancedV2();
    const combinedSummary = await aggregator.aggregateSummaries([]);

    expect(combinedSummary.totalFailureCount).toBe(0);
    expect(combinedSummary.aggregatedFailures).toEqual([]);
    expect(combinedSummary.totalSeverityWeight).toBe(0);
  });

  it("should correctly calculate total severity weight and context relevance score", async () => {
    const aggregator = new StructuredToolOutputValidationSummaryAggregatorV139AdvancedV2();
    const summary1 = {
      failures: [{
        path: "fieldA",
        description: "A is invalid",
        severity: "ERROR",
        context: "context1",
      }],
      severityWeight: 5,
      contextRelevanceScore: 0.8,
    };
    const summary2 = {
      failures: [{
        path: "fieldB",
        description: "B is missing",
        severity: "WARNING",
        context: "context2",
      }],
      severityWeight: 2,
      contextRelevanceScore: 0.5,
    };

    const combinedSummary = await aggregator.aggregateSummaries([
      summary1,
      summary2,
    ]);

    expect(combinedSummary.totalSeverityWeight).toBeCloseTo(7);
    expect(combinedSummary.averageContextRelevanceScore).toBeCloseTo(0.65);
  });
});