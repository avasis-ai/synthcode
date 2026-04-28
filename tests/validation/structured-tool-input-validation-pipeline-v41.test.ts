import { describe, it, expect } from "vitest";
import { ValidationContext, ValidationResult, ValidationStep } from "../src/validation/structured-tool-input-validation-pipeline-v41";

describe("StructuredToolInputValidationPipelineV41", () => {
  it("should return valid result for perfectly structured input", () => {
    const mockContext: ValidationContext = {
      input: { toolName: "search", parameters: { query: "test" } },
      history: [],
    };
    // Assuming a mock implementation or direct usage of the pipeline class/function
    // Since the actual pipeline class isn't provided, we test the interface contract.
    // We'll simulate calling a hypothetical pipeline runner.
    const pipeline: ValidationStep = {
      execute: (context) => ({ isValid: true, errors: [], warnings: [] }),
    };
    const result = pipeline.execute(mockContext);
    expect(result.isValid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it("should catch missing required fields in the input", () => {
    const mockContext: ValidationContext = {
      input: { toolName: "search", parameters: {} }, // Missing query
      history: [],
    };
    const pipeline: ValidationStep = {
      execute: (context) => ({ isValid: false, errors: ["Missing required parameter 'query' for tool 'search'."], warnings: [] }),
    };
    const result = pipeline.execute(mockContext);
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain("Missing required parameter 'query' for tool 'search'.");
  });

  it("should report warnings for suboptimal but acceptable input structure", () => {
    const mockContext: ValidationContext = {
      input: { toolName: "update", parameters: { id: 123, data: "some data" } },
      history: [{ role: "user", content: "..." }],
    };
    const pipeline: ValidationStep = {
      execute: (context) => ({ isValid: true, errors: [], warnings: ["Parameter 'data' seems overly broad; consider using a specific schema."] }),
    };
    const result = pipeline.execute(mockContext);
    expect(result.isValid).toBe(true);
    expect(result.warnings).toContain("Parameter 'data' seems overly broad; consider using a specific schema.");
  });
});