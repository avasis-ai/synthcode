import { describe, it, expect } from "vitest";
import { StructuredToolInputValidationPipelineV46 } from "../src/validation/structured-tool-input-validation-pipeline-v46";

describe("StructuredToolInputValidationPipelineV46", () => {
  it("should return valid result for correctly structured input", () => {
    const pipeline = new StructuredToolInputValidationPipelineV46();
    const input = {
      toolName: "search",
      parameters: {
        query: "vitest testing",
        maxResults: 10,
      },
    };
    const context = {};
    const result = pipeline.validate(input, context);
    expect(result.isValid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it("should return invalid result with errors for missing required parameters", () => {
    const pipeline = new StructuredToolInputValidationPipelineV46();
    const input = {
      toolName: "search",
      parameters: {
        query: "some query",
      },
    };
    const context = {};
    const result = pipeline.validate(input, context);
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain("Missing required parameter: maxResults for tool 'search'");
  });

  it("should handle null or undefined input gracefully", () => {
    const pipeline = new StructuredToolInputValidationPipelineV46();
    const context = {};
    const result = pipeline.validate(null as any, context);
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain("Input object cannot be null or undefined.");
  });
});