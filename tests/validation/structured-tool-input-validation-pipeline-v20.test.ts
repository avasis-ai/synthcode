import { describe, it, expect } from "vitest";
import { StructuredToolInputValidationPipelineV20 } from "../src/validation/structured-tool-input-validation-pipeline-v20";

describe("StructuredToolInputValidationPipelineV20", () => {
  it("should validate correctly when input is valid", () => {
    const pipeline = new StructuredToolInputValidationPipelineV20();
    const context: any = {
      input: { toolName: "search", arguments: { query: "test" } },
      messages: [],
      schema: { search: { type: "object", properties: { query: { type: "string" } } } },
    };
    const result = pipeline.validate(context);
    expect(result.isValid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it("should report errors when required arguments are missing", () => {
    const pipeline = new StructuredToolInputValidationPipelineV20();
    const context: any = {
      input: { toolName: "search", arguments: {} },
      messages: [],
      schema: { search: { type: "object", properties: { query: { type: "string", required: true } } } },
    };
    const result = pipeline.validate(context);
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain("Missing required argument: query");
  });

  it("should handle unknown tool names gracefully", () => {
    const pipeline = new StructuredToolInputValidationPipelineV20();
    const context: any = {
      input: { toolName: "unknownTool", arguments: {} },
      messages: [],
      schema: { search: { type: "object", properties: { query: { type: "string" } } } },
    };
    const result = pipeline.validate(context);
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain("Unknown tool name: unknownTool");
  });
});