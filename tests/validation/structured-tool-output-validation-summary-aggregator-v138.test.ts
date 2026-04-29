import { describe, it, expect } from "vitest";
import {
  StructuredToolOutputValidationSummaryAggregatorV138,
} from "../src/validation/structured-tool-output-validation-summary-aggregator-v138";

describe("StructuredToolOutputValidationSummaryAggregatorV138", () => {
  it("should correctly aggregate validation summaries for multiple tools", async () => {
    const mockSummaries = [
      {
        toolName: "toolA",
        isValid: true,
        fieldErrors: [],
        constraintViolations: [],
        rawOutput: { id: 1, data: "valid" },
      },
      {
        toolName: "toolB",
        isValid: false,
        fieldErrors: [{ field: "param1", message: "Missing required field" }],
        constraintViolations: [{ constraint: "minLength", field: "param2", message: "Too short" }],
        rawOutput: { id: 2, data: "invalid" },
      },
    ];
    const result = await StructuredToolOutputValidationSummaryAggregatorV138.aggregate(
      mockSummaries
    );

    expect(result.length).toBe(2);
    expect(result).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ toolName: "toolA", isValid: true }),
        expect.objectContaining({ toolName: "toolB", isValid: false }),
      ])
    );
  });

  it("should handle an empty array of summaries gracefully", async () => {
    const mockSummaries: any[] = [];
    const result = await StructuredToolOutputValidationSummaryAggregatorV138.aggregate(
      mockSummaries
    );
    expect(result).toEqual([]);
  });

  it("should correctly aggregate when all tools are valid", async () => {
    const mockSummaries = [
      {
        toolName: "toolX",
        isValid: true,
        fieldErrors: [],
        constraintViolations: [],
        rawOutput: { status: "ok" },
      },
      {
        toolName: "toolY",
        isValid: true,
        fieldErrors: [],
        constraintViolations: [],
        rawOutput: { status: "ok" },
      },
    ];
    const result = await StructuredToolOutputValidationSummaryAggregatorV138.aggregate(
      mockSummaries
    );

    expect(result.length).toBe(2);
    result.forEach((summary: any) => {
      expect(summary.isValid).toBe(true);
      expect(summary.fieldErrors).toEqual([]);
      expect(summary.constraintViolations).toEqual([]);
    });
  });
});