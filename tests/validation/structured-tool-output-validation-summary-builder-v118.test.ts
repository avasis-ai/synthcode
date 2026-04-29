import { describe, it, expect } from "vitest";
import {
  StructuredSummaryBuilderV118,
  StructuredSummary,
} from "../src/validation/structured-tool-output-validation-summary-builder-v118";

describe("StructuredSummaryBuilderV118", () => {
  it("should build a basic summary when no errors or warnings are present", () => {
    const builder = new StructuredSummaryBuilderV118();
    const summary = builder.buildSummary(
      [
        {
          toolName: "toolA",
          stage: "stage1",
          isValid: true,
          errors: [],
          warnings: [],
        },
        {
          toolName: "toolB",
          stage: "stage2",
          isValid: true,
          errors: [],
          warnings: [],
        },
      ]
    );
    expect(summary.totalTools).toBe(2);
    expect(summary.totalErrors).toBe(0);
    expect(summary.totalWarnings).toBe(0);
    expect(summary.errorFrequency).toEqual([
      { type: "N/A", count: 0 },
    ]);
  });

  it("should correctly count total errors and warnings from multiple tools", () => {
    const builder = new StructuredSummaryBuilderV118();
    const errors = [
      {
        toolName: "toolA",
        stage: "stage1",
        isValid: false,
        errors: [{
          toolName: "toolA",
          stage: "stage1",
          field: "field1",
          message: "Error A1",
          severity: "error",
        }],
        warnings: [],
      },
      {
        toolName: "toolB",
        stage: "stage2",
        isValid: false,
        errors: [{
          toolName: "toolB",
          stage: "stage2",
          field: "field2",
          message: "Error B1",
          severity: "error",
        }, {
          toolName: "toolB",
          stage: "stage2",
          field: "field3",
          message: "Error B2",
          severity: "error",
        }],
        warnings: [{
          toolName: "toolB",
          stage: "stage2",
          field: "field4",
          message: "Warning B1",
          severity: "warning",
        }],
      },
    ];
    const summary = builder.buildSummary(errors);
    expect(summary.totalTools).toBe(2);
    expect(summary.totalErrors).toBe(3);
    expect(summary.totalWarnings).toBe(1);
    expect(summary.errorFrequency.length).toBe(1);
    expect(summary.errorFrequency[0].type).toBe("N/A");
    expect(summary.errorFrequency[0].count).toBe(3);
  });

  it("should handle a scenario with mixed validation results", () => {
    const builder = new StructuredSummaryBuilderV118();
    const results = [
      {
        toolName: "toolX",
        stage: "stageX",
        isValid: true,
        errors: [],
        warnings: [],
      },
      {
        toolName: "toolY",
        stage: "stageY",
        isValid: false,
        errors: [{
          toolName: "toolY",
          stage: "stageY",
          field: "fieldY",
          message: "Error Y",
          severity: "error",
        }],
        warnings: [{
          toolName: "toolY",
          stage: "stageY",
          field: "fieldZ",
          message: "Warning Y",
          severity: "warning",
        }],
      },
    ];
    const summary = builder.buildSummary(results);
    expect(summary.totalTools).toBe(2);
    expect(summary.totalErrors).toBe(1);
    expect(summary.totalWarnings).toBe(1);
  });
});