import { describe, it, expect } from "vitest";
import {
  validateStructuredToolOutputSummaryAggregatorV124,
  ValidationSummary,
  ValidationSummaryEntry,
} from "../src/validation/structured-tool-output-validation-summary-aggregator-v124";

describe("validateStructuredToolOutputSummaryAggregatorV124", () => {
  it("should return a valid summary when all checks pass", () => {
    const mockSummary: ValidationSummary = {
      totalChecks: 3,
      passedChecks: 3,
      failedChecks: 0,
      overallSuccessRate: 1.0,
      failurePatternCounts: {
        any: 0,
      },
      detailedEntries: [
        {
          checkName: "checkA",
          isValid: true,
          severity: "INFO",
        },
        {
          checkName: "checkB",
          isValid: true,
          severity: "INFO",
        },
        {
          checkName: "checkC",
          isValid: true,
          severity: "INFO",
        },
      ],
    };
    const result = validateStructuredToolOutputSummaryAggregatorV124(mockSummary);
    expect(result).toBe(true);
  });

  it("should return invalid when there are failed checks", () => {
    const mockSummary: ValidationSummary = {
      totalChecks: 2,
      passedChecks: 1,
      failedChecks: 1,
      overallSuccessRate: 0.5,
      failurePatternCounts: {
        missingField: 1,
      },
      detailedEntries: [
        {
          checkName: "checkA",
          isValid: true,
          severity: "INFO",
        },
        {
          checkName: "checkB",
          isValid: false,
          severity: "ERROR",
          failureReason: "Missing required field",
        },
      ],
    };
    const result = validateStructuredToolOutputSummaryAggregatorV124(mockSummary);
    expect(result).toBe(false);
  });

  it("should handle an empty summary correctly", () => {
    const mockSummary: ValidationSummary = {
      totalChecks: 0,
      passedChecks: 0,
      failedChecks: 0,
      overallSuccessRate: 1.0,
      failurePatternCounts: {},
      detailedEntries: [],
    };
    const result = validateStructuredToolOutputSummaryAggregatorV124(mockSummary);
    expect(result).toBe(true);
  });
});