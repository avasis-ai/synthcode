import { describe, it, expect } from "vitest";
import { StructuredToolInputValidationPipelineBuilder } from "../src/validation/structured-tool-input-validation-pipeline-builder-v119";

describe("StructuredToolInputValidationPipelineBuilder", () => {
  it("should build a validation pipeline with a basic schema", () => {
    const builder = new StructuredToolInputValidationPipelineBuilder();
    builder.addSchema({
      toolName: { type: "string", required: true },
      parameters: {
        type: "object",
        properties: {
          query: { type: "string", required: true },
          limit: { type: "number", required: false },
        },
        required: ["query"],
      },
    });
    const pipeline = builder.build();
    const result = pipeline.validate({ toolName: "search", parameters: { query: "test" } });
    expect(result.isValid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it("should report errors for missing required fields", () => {
    const builder = new StructuredToolInputValidationPipelineBuilder();
    builder.addSchema({
      toolName: { type: "string", required: true },
      parameters: {
        type: "object",
        properties: {
          query: { type: "string", required: true },
          limit: { type: "number", required: false },
        },
        required: ["query"],
      },
    });
    const pipeline = builder.build();
    const result = pipeline.validate({ toolName: "search", parameters: {} });
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain("Missing required property: query in parameters");
  });

  it("should report errors for incorrect data types", () => {
    const builder = new StructuredToolInputValidationPipelineBuilder();
    builder.addSchema({
      toolName: { type: "string", required: true },
      parameters: {
        type: "object",
        properties: {
          query: { type: "string", required: true },
          limit: { type: "number", required: false },
        },
        required: ["query"],
      },
    });
    const pipeline = builder.build();
    const result = pipeline.validate({ toolName: 123, parameters: { query: "test", limit: "not a number" } });
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain("Invalid type for toolName: expected string, got number");
    expect(result.errors).toContain("Invalid type for parameters.limit: expected number, got string");
  });
});