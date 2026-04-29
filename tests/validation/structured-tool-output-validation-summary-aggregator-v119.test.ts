import { describe, it, expect } from "vitest";
import { StructuredToolOutputValidationSummaryAggregatorV119 } from "../src/validation/structured-tool-output-validation-summary-aggregator-v119";

describe("StructuredToolOutputValidationSummaryAggregatorV119", () => {
  it("should correctly aggregate validation summary from multiple tool results", () => {
    const aggregator = new StructuredToolOutputValidationSummaryAggregatorV119();
    const mockResults = [
      { toolName: "toolA", isValid: true, result: {} },
      { toolName: "toolB", isValid: false, result: { fieldPath: "field1", errorCode: "E1", message: "Error 1" } },
      { toolName: "toolA", isValid: false, result: { fieldPath: "field2", errorCode: "E2", message: "Error 2" } },
      { toolName: "toolC", isValid: true, result: {} },
    ];

    mockResults.forEach((mockResult, index) => {
      aggregator.addValidationResult(mockResult);
    });

    const summary = aggregator.getSummary();

    expect(summary.totalValidationsRun).toBe(4);
    expect(summary.totalFailures).toBe(2);
    expect(summary.successRatePercentage).toBeCloseTo((2 / 4) * 100);
    expect(summary.errorCounts).toEqual(expect.objectContaining({ E1: 1, E2: 1 }));
    expect(summary.mostFrequentErrorCodes).toEqual(expect.arrayContaining(["E1", "E2"]));
    expect(summary.detailedFailures.length).toBe(2);
  });

  it("should handle the case with no validation results", () => {
    const aggregator = new StructuredToolOutputValidationSummaryAggregatorV119();
    const summary = aggregator.getSummary();

    expect(summary.totalValidationsRun).toBe(0);
    expect(summary.totalFailures).toBe(0);
    expect(summary.successRatePercentage).toBe(100);
    expect(summary.errorCounts).toEqual({});
    expect(summary.mostFrequentErrorCodes).toEqual([]);
    expect(summary.detailedFailures).toEqual([]);
  });

  it("should correctly update summary when multiple failures share the same error code", () => {
    const aggregator = new StructuredToolOutputValidationSummaryAggregatorV119();
    const mockResults = [
      { toolName: "toolX", isValid: false, result: { fieldPath: "f1", errorCode: "E_DUP", message: "Dup 1" } },
      { toolName: "toolY", isValid: false, result: { fieldPath: "f2", errorCode: "E_DUP", message: "Dup 2" } },
      { toolName: "toolZ", isValid: true, result: {} },
    ];

    mockResults.forEach((mockResult) => {
      aggregator.addValidationResult(mockResult);
    });

    const summary = aggregator.getSummary();

    expect(summary.totalValidationsRun).toBe(3);
    expect(summary.totalFailures).toBe(2);
    expect(summary.errorCounts).toEqual(expect.objectContaining({ E_DUP: 2 }));
    expect(summary.mostFrequentErrorCodes).toEqual(["E_DUP"]);
  });
});