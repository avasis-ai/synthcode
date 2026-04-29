import { describe, it, expect } from "vitest";
import {
  StructuredToolOutputValidationSummaryAggregatorV127,
  ToolValidationResult,
  ValidationSummary,
} from "../src/validation/structured-tool-output-validation-summary-aggregator-v127";

describe("StructuredToolOutputValidationSummaryAggregatorV127", () => {
  it("should correctly aggregate validation results when all tools are valid", async () => {
    const mockResults: ToolValidationResult[] = [
      {
        toolName: "toolA",
        isValid: true,
        fieldErrors: [],
        metadata: { calls: 1 },
      },
      {
        toolName: "toolB",
        isValid: true,
        fieldErrors: [],
        metadata: { calls: 2 },
      },
    ];

    const aggregator = new StructuredToolOutputValidationSummaryAggregatorV127();
    const summary = await aggregator.aggregate(mockResults);

    expect(summary.overallSuccess).toBe(true);
    expect(summary.totalToolsValidated).toBe(2);
    expect(summary.compliantToolsCount).toBe(2);
    expect(summary.totalFieldErrors).toBe(0);
    expect(summary.mostFrequentConstraint).toBeUndefined();
  });

  it("should correctly aggregate validation results when some tools have errors", async () => {
    const mockResults: ToolValidationResult[] = [
      {
        toolName: "toolA",
        isValid: true,
        fieldErrors: [],
        metadata: { calls: 1 },
      },
      {
        toolName: "toolB",
        isValid: false,
        fieldErrors: [{ field: "param1", message: "Missing", constraint: "required" }],
        metadata: { calls: 2 },
      },
      {
        toolName: "toolC",
        isValid: false,
        fieldErrors: [{ field: "param1", message: "Too long", constraint: "maxLength" }],
        metadata: { calls: 1 },
      },
    ];

    const aggregator = new StructuredToolOutputValidationSummaryAggregatorV127();
    const summary = await aggregator.aggregate(mockResults);

    expect(summary.overallSuccess).toBe(false);
    expect(summary.totalToolsValidated).toBe(3);
    expect(summary.compliantToolsCount).toBe(1);
    expect(summary.totalFieldErrors).toBe(2);
    expect(summary.mostFrequentConstraint).toBe("required");
  });

  it("should handle an empty array of validation results", async () => {
    const mockResults: ToolValidationResult[] = [];

    const aggregator = new StructuredToolOutputValidationSummaryAggregatorV127();
    const summary = await aggregator.aggregate(mockResults);

    expect(summary.overallSuccess).toBe(true);
    expect(summary.totalToolsValidated).toBe(0);
    expect(summary.compliantToolsCount).toBe(0);
    expect(summary.totalFieldErrors).toBe(0);
    expect(summary.mostFrequentConstraint).toBeUndefined();
  });
});