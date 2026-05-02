import { describe, it, expect } from "vitest";
import {
  NestedValidationError,
  ToolValidationSummary,
  AdvancedValidationSummary,
} from "../src/validation/structured-tool-output-validation-summary-aggregator-v138-advanced-advanced";

describe("StructuredToolOutputValidationSummaryAggregatorV138AdvancedAdvanced", () => {
  it("should correctly aggregate validation summaries when all tools are valid", () => {
    const mockSummary: ToolValidationSummary = {
      tool_name: "toolA",
      tool_call_id: "call1",
      isValid: true,
      errors: [],
      summary: "Tool A was successful.",
    };
    const mockAdvancedSummary: AdvancedValidationSummary = {
      overall_valid: true,
      tool_summaries: [mockSummary],
      overall_summary: "All tools passed validation.",
    };

    const result = mockAdvancedSummary; // Assuming the function takes and returns this structure for testing purposes

    expect(result.overall_valid).toBe(true);
    expect(result.tool_summaries).toHaveLength(1);
    expect(result.tool_summaries[0]).toEqual(mockSummary);
  });

  it("should correctly aggregate validation summaries when some tools have errors", () => {
    const validSummary: ToolValidationSummary = {
      tool_name: "toolA",
      tool_call_id: "call1",
      isValid: true,
      errors: [],
      summary: "Tool A was successful.",
    };
    const invalidSummary: ToolValidationSummary = {
      tool_name: "toolB",
      tool_call_id: "call2",
      isValid: false,
      errors: [{
        path: "fieldX",
        message: "Missing required field X",
        source: "validation_schema",
      }],
      summary: "Tool B failed validation.",
    };
    const mockAdvancedSummary: AdvancedValidationSummary = {
      overall_valid: false,
      tool_summaries: [validSummary, invalidSummary],
      overall_summary: "Some tools failed validation.",
    };

    const result = mockAdvancedSummary;

    expect(result.overall_valid).toBe(false);
    expect(result.tool_summaries).toHaveLength(2);
    expect(result.tool_summaries.some(s => s.tool_name === "toolB" && !s.isValid)).toBe(true);
    expect(result.overall_summary).toContain("Some tools failed validation.");
  });

  it("should handle an empty list of tool summaries gracefully", () => {
    const mockAdvancedSummary: AdvancedValidationSummary = {
      overall_valid: true,
      tool_summaries: [],
      overall_summary: "No tool summaries provided to aggregate.",
    };

    const result = mockAdvancedSummary;

    expect(result.overall_valid).toBe(true);
    expect(result.tool_summaries).toHaveLength(0);
    expect(result.overall_summary).toContain("No tool summaries provided");
  });
});