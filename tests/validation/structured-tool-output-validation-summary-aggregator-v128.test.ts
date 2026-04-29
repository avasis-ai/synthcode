import { describe, it, expect } from "vitest";
import {
  Stru
} from "../src/validation/structured-tool-output-validation-summary-aggregator-v128";
import {
  ValidationResult,
  AggregatedSummary
} from "../src/validation/structured-tool-output-validation-summary-aggregator-v128.types";

describe("StructuredToolOutputValidationSummaryAggregatorV128", () => {
  it("should correctly aggregate results when all inputs are valid", () => {
    const mockResults: ValidationResult[] = [
      {
        sourceId: "source1",
        isValid: true,
        message: "Success",
        severity: "INFO"
      },
      {
        sourceId: "source2",
        isValid: true,
        message: "Success",
        severity: "INFO"
      }
    ];
    const aggregator = new Stru("dummy"); // Assuming constructor takes something
    const summary = aggregator.aggregate(mockResults);

    expect(summary.totalResults).toBe(2);
    expect(summary.successCount).toBe(2);
    expect(summary.errorCount).toBe(0);
    expect(summary.warningCount).toBe(0);
    expect(summary.failures).toEqual([]);
    expect(summary.warnings).toEqual([]);
    expect(summary.info).toHaveLength(2);
  });

  it("should correctly count errors and warnings when mixed results are provided", () => {
    const mockResults: ValidationResult[] = [
      {
        sourceId: "sourceA",
        isValid: false,
        message: "Error message",
        severity: "ERROR"
      },
      {
        sourceId: "sourceB",
        isValid: false,
        message: "Warning message",
        severity: "WARNING"
      },
      {
        sourceId: "sourceC",
        isValid: true,
        message: "Info message",
        severity: "INFO"
      }
    ];
    const aggregator = new Stru("dummy");
    const summary = aggregator.aggregate(mockResults);

    expect(summary.totalResults).toBe(3);
    expect(summary.successCount).toBe(1);
    expect(summary.errorCount).toBe(1);
    expect(summary.warningCount).toBe(1);
    expect(summary.failures).toHaveLength(1);
    expect(summary.warnings).toHaveLength(1);
    expect(summary.info).toHaveLength(1);
  });

  it("should handle an empty array of results gracefully", () => {
    const mockResults: ValidationResult[] = [];
    const aggregator = new Stru("dummy");
    const summary = aggregator.aggregate(mockResults);

    expect(summary.totalResults).toBe(0);
    expect(summary.successCount).toBe(0);
    expect(summary.errorCount).toBe(0);
    expect(summary.warningCount).toBe(0);
    expect(summary.failures).toEqual([]);
    expect(summary.warnings).toEqual([]);
    expect(summary.info).toEqual([]);
  });
});