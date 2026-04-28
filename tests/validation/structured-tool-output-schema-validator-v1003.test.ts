import { describe, it, expect } from "vitest";
import { StructuredToolOutputSchemaValidatorV1003 } from "../src/validation/structured-tool-output-schema-validator-v1003";

describe("StructuredToolOutputSchemaValidatorV1003", () => {
  it("should validate a correctly structured tool output against the schema", () => {
    const targetSchema: any = {
      type: "object",
      properties: {
        toolName: { type: "string" },
        output: { type: "object", properties: { result: { type: "string" } } },
      },
      required: ["toolName", "output"],
    };
    const validator = new StructuredToolOutputSchemaValidatorV1003(targetSchema);
    const validData = {
      toolName: "search_tool",
      output: { result: "search results found" },
    };
    const result = validator.validate(validData);
    expect(result.isValid).toBe(true);
  });

  it("should return invalid when a required field is missing", () => {
    const targetSchema: any = {
      type: "object",
      properties: {
        toolName: { type: "string" },
        output: { type: "object", properties: { result: { type: "string" } } },
      },
      required: ["toolName", "output"],
    };
    const validator = new StructuredToolOutputSchemaValidatorV1003(targetSchema);
    const invalidData = {
      toolName: "search_tool",
      // 'output' is missing
    };
    const result = validator.validate(invalidData);
    expect(result.isValid).toBe(false);
    expect(result.errors).toHaveLength(1);
  });

  it("should return invalid when data type does not match the schema", () => {
    const targetSchema: any = {
      type: "object",
      properties: {
        toolName: { type: "string" },
        output: { type: "object", properties: { result: { type: "string" } } },
      },
      required: ["toolName", "output"],
    };
    const validator = new StructuredToolOutputSchemaValidatorV1003(targetSchema);
    const invalidData = {
      toolName: 12345, // Should be string
      output: { result: "some result" },
    };
    const result = validator.validate(invalidData);
    expect(result.isValid).toBe(false);
    expect(result.errors).toEqual(expect.arrayContaining([
      expect.objectContaining({ field: "toolName", message: "Expected type string, got number" }),
    ]));
  });
});