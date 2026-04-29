import { describe, it, expect } from "vitest";
import {
  ValidationSummaryAggregatorV125,
} from "../src/validation/structured-tool-output-validation-summary-aggregator-v125";

describe("ValidationSummaryAggregatorV125", () => {
  it("should correctly aggregate summary when all results are successful", async () => {
    const mockResults = [
      {
        toolName: "toolA",
        success: true,
        output: { id: "1", name: "TestA" },
      },
      {
        toolName: "toolB",
        success: true,
        output: { id: "2", name: "TestB" },
      },
    ];
    const aggregator = new ValidationSummaryAggregatorV125();
    const summary = await aggregator.aggregate(mockResults);

    expect(summary.totalResultsProcessed).toBe(2);
    expect(summary.overallSuccess).toBe(true);
    expect(summary.failureBreakdown).toEqual({});
    expect(summary.summaryReport).toContain("2 out of 2 results were successful");
    expect(summary.hasHighRateOfMissingFields).toBe(false);
  });

  it("should correctly aggregate summary when some results fail", async () => {
    const mockResults = [
      {
        toolName: "toolA",
        success: true,
        output: { id: "1", name: "TestA" },
      },
      {
        toolName: "toolC",
        success: false,
        error: "Invalid JSON structure",
      },
      {
        toolName: "toolB",
        success: false,
        error: "Missing required field 'id'",
      },
    ];
    const aggregator = new ValidationSummaryAggregatorV125();
    const summary = await aggregator.aggregate(mockResults);

    expect(summary.totalResultsProcessed).toBe(3);
    expect(summary.overallSuccess).toBe(false);
    expect(summary.failureBreakdown).toEqual({
      toolC: {
        type: "Invalid JSON structure",
        count: 1,
        examples: ["Invalid JSON structure"],
      },
      toolB: {
        type: "Missing required field 'id'",
        count: 1,
        examples: ["Missing required field 'id'"],
      },
    });
    expect(summary.summaryReport).toContain("1 out of 3 results were successful");
  });

  it("should handle an empty list of results", async () => {
    const mockResults: any[] = [];
    const aggregator = new ValidationSummaryAggregatorV125();
    const summary = await aggregator.aggregate(mockResults);

    expect(summary.totalResultsProcessed).toBe(0);
    expect(summary.overallSuccess).toBe(true);
    expect(summary.failureBreakdown).toEqual({});
    expect(summary.summaryReport).toContain("0 out of 0 results were successful");
    expect(summary.hasHighRateOfMissingFields).toBe(false);
  });
});