import { describe, it, expect } from "vitest";
import {
  StructuredToolOutputValidationSummaryAggregatorV123,
  ValidationSummaryEntry,
} from "../src/validation/structured-tool-output-validation-summary-aggregator-v123";

describe("StructuredToolOutputValidationSummaryAggregatorV123", () => {
  it("should correctly aggregate validation results when all checks pass", async () => {
    const mockValidationResults = [
      {
        toolName: "toolA",
        fieldName: "field1",
        isValid: true,
        details: "Valid",
        sourceMetadata: { source: "user" },
      },
      {
        toolName: "toolA",
        fieldName: "field2",
        isValid: true,
        details: "Valid",
        sourceMetadata: { source: "assistant" },
      },
    ];

    const aggregator = new StructuredToolOutputValidationSummaryAggregatorV123();
    const summary = await aggregator.aggregate(mockValidationResults);

    expect(summary).toHaveLength(1);
    expect(summary[0].overallStatus).toBe("PASS");
    expect(summary[0].successfulChecks).toBe(2);
    expect(summary[0].failedChecks).toBe(0);
  });

  it("should correctly aggregate validation results when some checks fail", async () => {
    const mockValidationResults = [
      {
        toolName: "toolB",
        fieldName: "fieldX",
        isValid: true,
        details: "Valid",
        sourceMetadata: { source: "user" },
      },
      {
        toolName: "toolB",
        fieldName: "fieldY",
        isValid: false,
        details: "Missing required field",
        sourceMetadata: { source: "assistant" },
      },
      {
        toolName: "toolB",
        fieldName: "fieldY",
        isValid: false,
        details: "Wrong type",
        sourceMetadata: { source: "user" },
      },
    ];

    const aggregator = new StructuredToolOutputValidationSummaryAggregatorV123();
    const summary = await aggregator.aggregate(mockValidationResults);

    expect(summary).toHaveLength(1);
    expect(summary[0].overallStatus).toBe("FAIL");
    expect(summary[0].successfulChecks).toBe(1);
    expect(summary[0].failedChecks).toBe(2);
  });

  it("should handle an empty list of validation results gracefully", async () => {
    const mockValidationResults: any[] = [];

    const aggregator = new StructuredToolOutputValidationSummaryAggregatorV123();
    const summary = await aggregator.aggregate(mockValidationResults);

    expect(summary).toHaveLength(0);
  });
});