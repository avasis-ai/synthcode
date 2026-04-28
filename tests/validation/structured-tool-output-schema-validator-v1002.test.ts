import { describe, it, expect } from "vitest";
import { StructuredToolOutputSchemaValidatorV1002 } from "../src/validation/structured-tool-output-schema-validator-v1002";

describe("StructuredToolOutputSchemaValidatorV1002", () => {
  it("should validate a correctly structured tool output", () => {
    const validator = new StructuredToolOutputSchemaValidatorV1002();
    const context = {
      previousToolOutputs: {},
      currentMessageHistory: [],
    };
    const validOutput = {
      toolName: "someTool",
      output: "{\"key\": \"value\"}",
    };
    const result = validator.validate(context, validOutput);
    expect(result.isValid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it("should return invalid if toolName is missing", () => {
    const validator = new StructuredToolOutputSchemaValidatorV1002();
    const context = {
      previousToolOutputs: {},
      currentMessageHistory: [],
    };
    const invalidOutput = {
      output: "{\"key\": \"value\"}",
    };
    const result = validator.validate(context, invalidOutput);
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain("toolName is required");
  });

  it("should return invalid if output is not a JSON string", () => {
    const validator = new StructuredToolOutputSchemaValidatorV1002();
    const context = {
      previousToolOutputs: {},
      currentMessageHistory: [],
    };
    const invalidOutput = {
      toolName: "someTool",
      output: "this is not json",
    };
    const result = validator.validate(context, invalidOutput);
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain("output must be a valid JSON string");
  });
});