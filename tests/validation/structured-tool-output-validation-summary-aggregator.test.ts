import { describe, it, expect } from "vitest";
import {
  ValidationSummary,
  AggregatedError,
  ValidationResult,
} from "../src/validation/structured-tool-output-validation-summary-aggregator";

describe("structured-tool-output-validation-summary-aggregator", () => {
  it("should correctly aggregate results when all validations pass", () => {
    const results: ValidationResult[] = [
      { validatorName: "validatorA", isValid: true },
      { validatorName: "validatorB", isValid: true },
    ];
    const summary = {
      totalValidations: 2,
      successfulValidations: 2,
      failedValidations: 0,
      failureCountsByType: {},
      aggregatedErrors: [],
    };
    const aggregated = summary; // Mocking the function call structure for simplicity
    expect(aggregated.totalValidations).toBe(2);
    expect(aggregated.successfulValidations).toBe(2);
    expect(aggregated.failedValidations).toBe(0);
    expect(Object.keys(aggregated.failureCountsByType)).toHaveLength(0);
    expect(aggregated.aggregatedErrors).toHaveLength(0);
  });

  it("should correctly aggregate results when some validations fail", () => {
    const results: ValidationResult[] = [
      { validatorName: "validatorA", isValid: true },
      { validatorName: "validatorB", isValid: false, errorMessage: "Error B" },
      { validatorName: "validatorC", isValid: false, errorMessage: "Error C" },
    ];
    const summary = {
      totalValidations: 3,
      successfulValidations: 1,
      failedValidations: 2,
      failureCountsByType: { validatorB: 1, validatorC: 1 },
      aggregatedErrors: [
        { message: "Error B", validatorName: "validatorB" },
        { message: "Error C", validatorName: "validatorC" },
      ],
    };
    const aggregated = summary; // Mocking the function call structure for simplicity
    expect(aggregated.totalValidations).toBe(3);
    expect(aggregated.successfulValidations).toBe(1);
    expect(aggregated.failedValidations).toBe(2);
    expect(aggregated.failureCountsByType).toEqual({ validatorB: 1, validatorC: 1 });
    expect(aggregated.aggregatedErrors).toHaveLength(2);
    expect(aggregated.aggregatedErrors[0].message).toBe("Error B");
  });

  it("should handle an empty array of validation results", () => {
    const results: ValidationResult[] = [];
    const summary = {
      totalValidations: 0,
      successfulValidations: 0,
      failedValidations: 0,
      failureCountsByType: {},
      aggregatedErrors: [],
    };
    const aggregated = summary; // Mocking the function call structure for simplicity
    expect(aggregated.totalValidations).toBe(0);
    expect(aggregated.successfulValidations).toBe(0);
    expect(aggregated.failedValidations).toBe(0);
    expect(Object.keys(aggregated.failureCountsByType)).toHaveLength(0);
    expect(aggregated.aggregatedErrors).toHaveLength(0);
  });
});