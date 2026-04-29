import { describe, it, expect } from "vitest";
import { validateStructuredToolOutputSummaryAggregator } from "../src/validation/structured-tool-output-validation-summary-aggregator-v132";

describe("validateStructuredToolOutputSummaryAggregator", () => {
  it("should return an empty summary when no validation entries are provided", () => {
    const summary = validateStructuredToolOutputSummaryAggregator([]);
    expect(summary).toEqual({
      toolName: "",
      stepIdentifier: "",
      validationEntries: [],
    });
  });

  it("should correctly aggregate multiple validation entries for the same tool and step", () => {
    const entries: any[] = [
      {
        toolName: "toolA",
        stepIdentifier: "step1",
        validationType: "SchemaMismatch",
        message: "Schema mismatch for field X",
        severity: "ERROR",
        context: { field: "X" },
      },
      {
        toolName: "toolA",
        stepIdentifier: "step1",
        validationType: "TypeError",
        message: "Expected number, got string",
        severity: "ERROR",
        context: { field: "Y" },
      },
      {
        toolName: "toolB",
        stepIdentifier: "step2",
        validationType: "ConstraintViolation",
        message: "Value out of range",
        severity: "WARNING",
        context: { field: "Z" },
      },
    ];
    const summary = validateStructuredToolOutputSummaryAggregator(entries);
    expect(summary.toolName).toBe("toolA"); // Note: The implementation might only use the first toolName or aggregate differently. Assuming it aggregates based on the first entry's toolName or a specific rule.
    expect(summary.stepIdentifier).toBe("step1"); // Assuming it aggregates based on the first stepIdentifier.
    expect(summary.validationEntries).toHaveLength(3);
    expect(summary.validationEntries).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          toolName: "toolA",
          stepIdentifier: "step1",
          validationType: "SchemaMismatch",
          message: "Schema mismatch for field X",
          severity: "ERROR",
          context: { field: "X" },
        }),
        expect.objectContaining({
          toolName: "toolA",
          stepIdentifier: "step1",
          validationType: "TypeError",
          message: "Expected number, got string",
          severity: "ERROR",
          context: { field: "Y" },
        }),
        expect.objectContaining({
          toolName: "toolB",
          stepIdentifier: "step2",
          validationType: "ConstraintViolation",
          message: "Value out of range",
          severity: "WARNING",
          context: { field: "Z" },
        }),
      ])
    );
  });

  it("should correctly handle a single validation entry", () => {
    const entries: any[] = [
      {
        toolName: "singleTool",
        stepIdentifier: "singleStep",
        validationType: "Other",
        message: "Test message",
        severity: "INFO",
        context: { data: true },
      },
    ];
    const summary = validateStructuredToolOutputSummaryAggregator(entries);
    expect(summary.toolName).toBe("singleTool");
    expect(summary.stepIdentifier).toBe("singleStep");
    expect(summary.validationEntries).toHaveLength(1);
    expect(summary.validationEntries[0]).toEqual(
      expect.objectContaining({
        toolName: "singleTool",
        stepIdentifier: "singleStep",
        validationType: "Other",
        message: "Test message",
        severity: "INFO",
        context: { data: true },
      })
    );
  });
});