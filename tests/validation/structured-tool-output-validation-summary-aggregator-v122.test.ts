import { describe, it, expect } from "vitest";
import {
  StructuredToolOutputValidationSummaryAggregatorV122,
} from "../src/validation/structured-tool-output-validation-summary-aggregator-v122";
import {
  ValidationSummaryEntry,
  AggregatedValidationSummary,
} from "../src/validation/structured-tool-output-validation-summary-aggregator-v122.types";

describe("StructuredToolOutputValidationSummaryAggregatorV122", () => {
  it("should correctly aggregate summary when all tools are valid", () => {
    const mockEntries: ValidationSummaryEntry[] = [
      {
        toolName: "toolA",
        isValid: true,
        errorCount: 0,
        warnings: [],
        details: {},
      },
      {
        toolName: "toolB",
        isValid: true,
        errorCount: 0,
        warnings: [],
        details: {},
      },
    ];
    const aggregator = new StructuredToolOutputValidationSummaryAggregatorV122();
    const summary = aggregator.aggregate(mockEntries);

    expect(summary.totalEntries).toBe(2);
    expect(summary.successfulEntries).toBe(2);
    expect(summary.failedEntries).toBe(0);
    expect(summary.overallSuccessRate).toBe(1.0);
    expect(summary.errorTypeCounts).toEqual({});
    expect(summary.summaryReport.issuesFound).toBe(0);
    expect(summary.summaryReport.warningsCount).toBe(0);
  });

  it("should correctly aggregate summary when some tools fail validation", () => {
    const mockEntries: ValidationSummaryEntry[] = [
      {
        toolName: "toolA",
        isValid: true,
        errorCount: 0,
        warnings: [],
        details: {},
      },
      {
        toolName: "toolB",
        isValid: false,
        errorCount: 2,
        warnings: ["Warning on B"],
        details: {
          errorType: "SchemaMismatch",
        },
      },
      {
        toolName: "toolC",
        isValid: false,
        errorCount: 1,
        warnings: [],
        details: {
          errorType: "MissingField",
        },
      },
    ];
    const aggregator = new StructuredToolOutputValidationSummaryAggregatorV122();
    const summary = aggregator.aggregate(mockEntries);

    expect(summary.totalEntries).toBe(3);
    expect(summary.successfulEntries).toBe(1);
    expect(summary.failedEntries).toBe(2);
    expect(summary.overallSuccessRate).toBeCloseTo(1 / 3);
    expect(summary.errorTypeCounts).toEqual({
      SchemaMismatch: 1,
      MissingField: 1,
    });
    expect(summary.summaryReport.issuesFound).toBe(2);
    expect(summary.summaryReport.warningsCount).toBe(1);
  });

  it("should handle an empty array of entries gracefully", () => {
    const mockEntries: ValidationSummaryEntry[] = [];
    const aggregator = new StructuredToolOutputValidationSummaryAggregatorV122();
    const summary = aggregator.aggregate(mockEntries);

    expect(summary.totalEntries).toBe(0);
    expect(summary.successfulEntries).toBe(0);
    expect(summary.failedEntries).toBe(0);
    expect(summary.overallSuccessRate).toBe(1.0);
    expect(summary.errorTypeCounts).toEqual({});
    expect(summary.summaryReport.issuesFound).toBe(0);
    expect(summary.summaryReport.warningsCount).toBe(0);
  });
});