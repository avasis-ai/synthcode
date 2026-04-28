import { describe, it, expect } from "vitest";
import {
  StructuredToolOutputValidationPipelineV50,
} from "../src/validation/structured-tool-output-validation-pipeline-v50";

describe("StructuredToolOutputValidationPipelineV50", () => {
  it("should return valid result for correctly structured output", async () => {
    const pipeline = new StructuredToolOutputValidationPipelineV50();
    const validOutput: ToolResultMessage = {
      toolName: "testTool",
      output: JSON.stringify({
        id: "123",
        status: "SUCCESS",
        data: {
          value: "test",
        },
      }),
    };
    const result = await pipeline.validate(validOutput);
    expect(result.isValid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it("should detect missing required fields in the output JSON", async () => {
    const pipeline = new StructuredToolOutputValidationPipelineV50();
    const invalidOutput: ToolResultMessage = {
      toolName: "testTool",
      output: JSON.stringify({
        id: "123",
        // status is missing
        data: {
          value: "test",
        },
      }),
    };
    const result = await pipeline.validate(invalidOutput);
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain("Missing required field: status");
  });

  it("should handle malformed JSON output gracefully", async () => {
    const pipeline = new StructuredToolOutputValidationPipelineV50();
    const malformedOutput: ToolResultMessage = {
      toolName: "testTool",
      output: '{"id": "123", "status": "SUCCESS", "data": {', // Missing closing brace
    };
    const result = await pipeline.validate(malformedOutput);
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain("Invalid JSON format");
  });
});