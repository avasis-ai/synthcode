import { describe, it, expect } from "vitest";
import { ValidationPipelineV22 } from "../src/validation/structured-tool-input-validation-pipeline-v22";

describe("ValidationPipelineV22", () => {
  it("should pass validation for correctly structured input", async () => {
    const pipeline = new ValidationPipelineV22();
    const input: Record<string, unknown> = {
      toolName: "search",
      parameters: {
        query: "test query",
        limit: 10,
      },
    };
    const result = await pipeline.validate(input);
    expect(result.errors).toEqual([]);
    expect(result.isValid).toBe(true);
  });

  it("should catch missing required fields", async () => {
    const pipeline = new ValidationPipelineV22();
    const input: Record<string, unknown> = {
      toolName: "search",
      parameters: {}, // Missing required 'query'
    };
    const result = await pipeline.validate(input);
    expect(result.isValid).toBe(false);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0].field).toBe("parameters.query");
  });

  it("should catch type mismatch errors", async () => {
    const pipeline = new ValidationPipelineV22();
    const input: Record<string, unknown> = {
      toolName: "search",
      parameters: {
        query: "test query",
        limit: "not a number", // Incorrect type
      },
    };
    const result = await pipeline.validate(input);
    expect(result.isValid).toBe(false);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0].field).toBe("parameters.limit");
  });
});