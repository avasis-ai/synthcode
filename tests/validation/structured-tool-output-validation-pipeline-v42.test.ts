import { describe, it, expect } from "vitest";
import { StructuredToolOutputValidationPipelineV42 } from "../src/validation/structured-tool-output-validation-pipeline-v42";

describe("StructuredToolOutputValidationPipelineV42", () => {
  it("should validate a perfectly structured tool output", () => {
    const pipeline = new StructuredToolOutputValidationPipelineV42();
    const validOutput = {
      toolName: "someTool",
      toolInput: {
        param1: "value1",
        param2: 123,
      },
      // Add other expected fields if necessary for a full test
    };
    const result = pipeline.validate(validOutput, {});
    expect(result.isValid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it("should detect missing required fields in the tool output", () => {
    const pipeline = new StructuredToolOutputValidationPipelineV42();
    const invalidOutput = {
      // Missing toolName
      toolInput: {
        param1: "value1",
      },
    };
    const result = pipeline.validate(invalidOutput, {});
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain("Missing required field: toolName");
  });

  it("should handle null or undefined inputs gracefully", () => {
    const pipeline = new StructuredToolOutputValidationPipelineV42();
    const invalidOutput = null as unknown as Record<string, unknown>;
    const result = pipeline.validate(invalidOutput, {});
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain("Input output cannot be null or undefined");
  });
});