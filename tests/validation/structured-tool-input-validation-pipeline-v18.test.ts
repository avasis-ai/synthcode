import { describe, it, expect } from "vitest";
import { StructuredToolInputValidationPipelineV18 } from "../src/validation/structured-tool-input-validation-pipeline-v18";

describe("StructuredToolInputValidationPipelineV18", () => {
  it("should return valid result when input data is correct", async () => {
    const mockContext: any = {
      inputData: { toolName: "search", parameters: { query: "test" } },
      history: [],
      getPreviousStepResult: () => ({ isValid: true, errors: [], context: {} }),
      getCurrentContext: () => ({}),
    };
    const pipeline = new StructuredToolInputValidationPipelineV18();
    const result = await pipeline.validate(mockContext);
    expect(result.isValid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it("should return invalid result with errors when input data is missing required fields", async () => {
    const mockContext: any = {
      inputData: { toolName: "search", parameters: {} },
      history: [],
      getPreviousStepResult: () => ({ isValid: true, errors: [], context: {} }),
      getCurrentContext: () => ({}),
    };
    const pipeline = new StructuredToolInputValidationPipelineV18();
    const result = await pipeline.validate(mockContext);
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain("Parameters are required for the given tool.");
  });

  it("should handle context dependency errors correctly", async () => {
    const mockContext: any = {
      inputData: { toolName: "complex_tool", parameters: { id: 123 } },
      history: [{ role: "user", content: { type: "text", text: "Hi" } }],
      getPreviousStepResult: () => ({ isValid: false, errors: ["Previous step failed"], context: {} }),
      getCurrentContext: () => ({ lastId: 123 }),
    };
    const pipeline = new StructuredToolInputValidationPipelineV18();
    const result = await pipeline.validate(mockContext);
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain("Validation failed due to previous step errors.");
  });
});