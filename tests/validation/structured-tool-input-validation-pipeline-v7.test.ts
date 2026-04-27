import { describe, it, expect } from "vitest";
import { StructuredToolInputValidationPipelineV7 } from "../src/validation/structured-tool-input-validation-pipeline-v7";

describe("StructuredToolInputValidationPipelineV7", () => {
  it("should pass validation for a perfectly structured and semantically correct input", async () => {
    const pipeline = new StructuredToolInputValidationPipelineV7();
    const validData = {
      toolName: "search_tool",
      parameters: {
        query: "vitest testing",
        maxResults: 10,
      },
    };
    const result = await pipeline.validate(validData);
    expect(result.isValid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it("should fail validation for missing required parameters", async () => {
    const pipeline = new StructuredToolInputValidationPipelineV7();
    const invalidData = {
      toolName: "search_tool",
      parameters: {
        // query is missing
        maxResults: 5,
      },
    };
    const result = await pipeline.validate(invalidData);
    expect(result.isValid).toBe(false);
    expect(result.errors).toContainEqual(
      expect.stringContaining("Missing required parameter: query")
    );
  });

  it("should fail validation for incorrect data types", async () => {
    const pipeline = new StructuredToolInputValidationPipelineV7();
    const invalidData = {
      toolName: "search_tool",
      parameters: {
        query: "test",
        maxResults: "not a number", // Incorrect type
      },
    };
    const result = await pipeline.validate(invalidData);
    expect(result.isValid).toBe(false);
    expect(result.errors).toContainEqual(
      expect.stringContaining("Invalid type for maxResults")
    );
  });
});