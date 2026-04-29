import { describe, it, expect } from "vitest";
import { StructuredToolOutputValidationSummary } from "../src/validation/structured-tool-output-validation-summary";

describe("StructuredToolOutputValidationSummary", () => {
  it("should correctly calculate summary when all validations pass", () => {
    const results = [
      { validatorName: "A", isValid: true, message: "OK" },
      { validatorName: "B", isValid: true, message: "OK" },
    ];
    const summary = new StructuredToolOutputValidationSummary(results);

    expect(summary.getTotalResults()).toBe(2);
    expect(summary.getSuccessfulValidations()).toBe(2);
    expect(summary.getFailedValidations()).toBe(0);
    expect(summary.getFailuresByType()).toEqual({});
    expect(summary.getTopErrors()).toEqual([]);
  });

  it("should correctly calculate summary with mixed results", () => {
    const results = [
      { validatorName: "A", isValid: true, message: "OK" },
      { validatorName: "B", isValid: false, message: "Error B" },
      { validatorName: "C", isValid: false, message: "Error C" },
      { validatorName: "D", isValid: true, message: "OK" },
    ];
    const summary = new StructuredToolOutputValidationSummary(results);

    expect(summary.getTotalResults()).toBe(4);
    expect(summary.getSuccessfulValidations()).toBe(2);
    expect(summary.getFailedValidations()).toBe(2);
    expect(summary.getFailuresByType()).toEqual({ "Error B": 1, "Error C": 1 });
    expect(summary.getTopErrors()).toEqual([{ error: "Error B", count: 1 }, { error: "Error C", count: 1 }]);
  });

  it("should handle an empty list of results", () => {
    const results: any[] = [];
    const summary = new StructuredToolOutputValidationSummary(results);

    expect(summary.getTotalResults()).toBe(0);
    expect(summary.getSuccessfulValidations()).toBe(0);
    expect(summary.getFailedValidations()).toBe(0);
    expect(summary.getFailuresByType()).toEqual({});
    expect(summary.getTopErrors()).toEqual([]);
  });
});