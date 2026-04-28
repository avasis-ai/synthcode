import { describe, it, expect } from "vitest";
import { StructuredToolOutputValidationPipelineV64 } from "../src/validation/structured-tool-output-validation-pipeline-v64";

describe("StructuredToolOutputValidationPipelineV64", () => {
  it("should correctly validate a perfectly structured output", async () => {
    const pipeline = new StructuredToolOutputValidationPipelineV64();
    const context: any = {
      inputOutput: {
        toolName: "exampleTool",
        output: JSON.stringify({ id: 1, data: "test" }),
      },
      history: [],
    };
    const result = await pipeline.validate(context);
    expect(result.isValid).toBe(true);
    expect(result.output).toEqual({
      isValid: true,
      processedOutput: {
        id: 1,
        data: "test",
      },
    });
  });

  it("should fail validation when the output is missing required fields", async () => {
    const pipeline = new StructuredToolOutputValidationPipelineV64();
    const context: any = {
      inputOutput: {
        toolName: "exampleTool",
        output: JSON.stringify({ data: "test" }), // Missing 'id'
      },
      history: [],
    };
    const result = await pipeline.validate(context);
    expect(result.isValid).toBe(false);
    expect(result.output).toEqual({
      isValid: false,
      error: "Missing required field: id",
    });
  });

  it("should handle non-JSON string output gracefully", async () => {
    const pipeline = new StructuredToolOutputValidationPipelineV64();
    const context: any = {
      inputOutput: {
        toolName: "exampleTool",
        output: "This is not JSON",
      },
      history: [],
    };
    const result = await pipeline.validate(context);
    expect(result.isValid).toBe(false);
    expect(result.output).toEqual({
      isValid: false,
      error: "Invalid JSON format in tool output",
    });
  });
});