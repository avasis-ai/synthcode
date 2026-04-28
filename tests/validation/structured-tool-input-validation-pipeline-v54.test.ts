import { describe, it, expect } from "vitest";
import { validateStructuredToolInputPipelineV54, ValidationContext, ValidationResult } from "../src/validation/structured-tool-input-validation-pipeline-v54";

describe("validateStructuredToolInputPipelineV54", () => {
  it("should return valid when input data is correct", () => {
    const mockContext: ValidationContext = {
      inputData: { toolName: "search", parameters: { query: "test" } },
      history: [],
      globalContext: {},
      getPreviousStepResult: () => null,
      getGlobalContext: () => undefined,
    };
    const result: ValidationResult = validateStructuredToolInputPipelineV54(mockContext);
    expect(result.isValid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it("should return invalid with error for missing toolName", () => {
    const mockContext: ValidationContext = {
      inputData: { parameters: { query: "test" } },
      history: [],
      globalContext: {},
      getPreviousStepResult: () => null,
      getGlobalContext: () => undefined,
    };
    const result: ValidationResult = validateStructuredToolInputPipelineV54(mockContext);
    expect(result.isValid).toBe(false);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0].field).toBe("toolName");
    expect(result.errors[0].message).toContain("is required");
  });

  it("should return invalid with error for invalid parameters type", () => {
    const mockContext: ValidationContext = {
      inputData: { toolName: "search", parameters: "not_an_object" },
      history: [],
      globalContext: {},
      getPreviousStepResult: () => null,
      getGlobalContext: () => undefined,
    };
    const result: ValidationResult = validateStructuredToolInputPipelineV54(mockContext);
    expect(result.isValid).toBe(false);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0].field).toBe("parameters");
    expect(result.errors[0].message).toContain("must be an object");
  });
});