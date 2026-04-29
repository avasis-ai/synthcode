import { describe, it, expect } from "vitest";
import { validateStructuredToolOutputSummaryAggregatorV131 } from "../src/validation/structured-tool-output-validation-summary-aggregator-v131";

describe("validateStructuredToolOutputSummaryAggregatorV131", () => {
  it("should return true for a valid summary structure", () => {
    const validSummary = {
      validationSummary: [
        {
          toolCallId: "call_abc123",
          stage: "schema_validation",
          severity: "ERROR",
          failureType: "schema_mismatch",
          message: "The output schema does not match the expected structure.",
        },
        {
          toolCallId: "call_def456",
          stage: "semantic_validation",
          severity: "WARNING",
          failureType: "semantic_mismatch",
          message: "The extracted entity 'date' seems out of expected range.",
        },
        {
          toolCallId: "call_ghi789",
          stage: "temporal_validation",
          severity: "INFO",
          failureType: "unknown",
          message: "Successfully validated temporal constraints.",
        },
      ],
    };
    expect(validateStructuredToolOutputSummaryAggregatorV131(validSummary)).toBe(true);
  });

  it("should return false if validationSummary is missing", () => {
    const invalidSummary = {};
    expect(validateStructuredToolOutputSummaryAggregatorV131(invalidSummary)).toBe(false);
  });

  it("should return false if any entry in validationSummary is missing required fields", () => {
    const incompleteSummary = {
      validationSummary: [
        {
          toolCallId: "call_abc123",
          stage: "schema_validation",
          severity: "ERROR",
          failureType: "schema_mismatch",
          // message is missing
        },
      ],
    };
    expect(validateStructuredToolOutputSummaryAggregatorV131(incompleteSummary)).toBe(false);
  });
});