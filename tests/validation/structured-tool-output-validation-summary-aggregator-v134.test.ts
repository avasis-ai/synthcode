import { describe, it, expect } from "vitest";
import {
  StructuredToolOutputValidationSummaryAggregatorV134,
} from "../src/validation/structured-tool-output-validation-summary-aggregator-v134";
import {
  ValidationSummary,
  AggregatedValidationReport,
} from "../src/validation/types";

describe("StructuredToolOutputValidationSummaryAggregatorV134", () => {
  it("should correctly aggregate validation summaries for multiple tools", async () => {
    const summary1: ValidationSummary = {
      toolId: "toolA",
      isValid: true,
      errors: [],
      warnings: [{ type: "Warning", message: "Minor issue", fieldPath: "field1" }],
    };
    const summary2: ValidationSummary = {
      toolId: "toolB",
      isValid: false,
      errors: [{ type: "Error", message: "Missing required field", fieldPath: "field2" }],
      warnings: [],
    };
    const summary3: ValidationSummary = {
      toolId: "toolC",
      isValid: true,
      errors: [],
      warnings: [],
    };

    const aggregator = new StructuredToolOutputValidationSummaryAggregatorV134();
    const report = await aggregator.aggregate([summary1, summary2, summary3]);

    expect(report.totalToolsValidated).toBe(3);
    expect(report.overallSuccess).toBe(false);
    expect(report.errorSummary["Error"]).toBeDefined();
    expect(report.errorSummary["Error"]!.count).toBe(1);
    expect(report.warningSummary["Warning"]?.count).toBe(1);
  });

  it("should handle cases where all tools are valid", async () => {
    const summary1: ValidationSummary = {
      toolId: "toolA",
      isValid: true,
      errors: [],
      warnings: [],
    };
    const summary2: ValidationSummary = {
      toolId: "toolB",
      isValid: true,
      errors: [],
      warnings: [],
    };

    const aggregator = new StructuredToolOutputValidationSummaryAggregatorV134();
    const report = await aggregator.aggregate([summary1, summary2]);

    expect(report.totalToolsValidated).toBe(2);
    expect(report.overallSuccess).toBe(true);
    expect(report.errorSummary).toEqual({});
    expect(report.warningSummary).toEqual({});
  });

  it("should handle an empty list of summaries", async () => {
    const aggregator = new StructuredToolOutputValidationSummaryAggregatorV134();
    const report = await aggregator.aggregate([]);

    expect(report.totalToolsValidated).toBe(0);
    expect(report.overallSuccess).toBe(true);
    expect(report.errorSummary).toEqual({});
    expect(report.warningSummary).toEqual({});
  });
});