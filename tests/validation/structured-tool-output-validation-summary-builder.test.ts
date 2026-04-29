import { describe, it, expect } from "vitest";
import { StructuredToolOutputValidationSummaryBuilder } from "../src/validation/structured-tool-output-validation-summary-builder";

describe("StructuredToolOutputValidationSummaryBuilder", () => {
  it("should initialize with zero failures and warnings", () => {
    const builder = new StructuredToolOutputValidationSummaryBuilder();
    expect(builder.getSummary()).toEqual({
      totalFailures: 0,
      totalWarnings: 0,
      errorsByStep: {},
      warningsByStep: {},
      allErrors: [],
      allWarnings: [],
    });
  });

  it("should correctly add and count errors and warnings", () => {
    const builder = new StructuredToolOutputValidationSummaryBuilder();
    builder.addError("step1", "Error A");
    builder.addError("step1", "Error B");
    builder.addWarning("step2", "Warning X");
    builder.addWarning("step2", "Warning Y");
    builder.addError("step3", "Error C");

    const summary = builder.getSummary();
    expect(summary.totalFailures).toBe(3);
    expect(summary.totalWarnings).toBe(2);
    expect(summary.errorsByStep).toEqual({
      step1: ["Error A", "Error B"],
      step3: ["Error C"],
    });
    expect(summary.warningsByStep).toEqual({
      step2: ["Warning X", "Warning Y"],
    });
    expect(summary.allErrors).toHaveLength(3);
    expect(summary.allWarnings).toHaveLength(2);
  });

  it("should handle multiple steps with mixed errors and warnings", () => {
    const builder = new StructuredToolOutputValidationSummaryBuilder();
    builder.addError("stepA", "Error 1");
    builder.addWarning("stepA", "Warning 1");
    builder.addError("stepB", "Error 2");
    builder.addWarning("stepB", "Warning 2");
    builder.addWarning("stepC", "Warning 3");

    const summary = builder.getSummary();
    expect(summary.totalFailures).toBe(2);
    expect(summary.totalWarnings).toBe(3);
    expect(summary.errorsByStep).toEqual({
      stepA: ["Error 1"],
      stepB: ["Error 2"],
    });
    expect(summary.warningsByStep).toEqual({
      stepA: ["Warning 1"],
      stepB: ["Warning 2"],
      stepC: ["Warning 3"],
    });
    expect(summary.allErrors).toEqual(["Error 1", "Error 2"]);
    expect(summary.allWarnings).toEqual(["Warning 1", "Warning 2", "Warning 3"]);
  });
});