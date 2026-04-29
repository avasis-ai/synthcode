import { describe, it, expect } from "vitest";
import { StructuredToolOutputSchemaValidatorV1019 } from "../src/validation/structured-tool-output-schema-validator-v1019";

describe("StructuredToolOutputSchemaValidatorV1019", () => {
  it("should validate a correctly structured tool output object", () => {
    const schema: any = {
      type: "object",
      properties: {
        toolName: { type: "string" },
        toolOutput: {
          type: "object",
          properties: {
            result: { type: "string" },
            success: { type: "boolean" },
          },
          required: ["result", "success"],
        },
      },
      required: ["toolName", "toolOutput"],
    };

    const validator = new StructuredToolOutputSchemaValidatorV1019(schema);
    const validOutput = {
      toolName: "search_tool",
      toolOutput: {
        result: "Search results found.",
        success: true,
      },
    };

    const result = validator.validate(validOutput);
    expect(result.isValid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it("should return false and errors for missing required fields", () => {
    const schema: any = {
      type: "object",
      properties: {
        toolName: { type: "string" },
        toolOutput: {
          type: "object",
          properties: {
            result: { type: "string" },
            success: { type: "boolean" },
          },
          required: ["result", "success"],
        },
      },
      required: ["toolName", "toolOutput"],
    };

    const validator = new StructuredToolOutputSchemaValidatorV1019(schema);
    const invalidOutput = {
      toolName: "search_tool",
      // toolOutput is missing
    };

    const result = validator.validate(invalidOutput);
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain("Missing required property: toolOutput");
  });

  it("should return false and errors for incorrect data types", () => {
    const schema: any = {
      type: "object",
      properties: {
        toolName: { type: "string" },
        toolOutput: {
          type: "object",
          properties: {
            result: { type: "string" },
            success: { type: "boolean" },
          },
          required: ["result", "success"],
        },
      },
      required: ["toolName", "toolOutput"],
    };

    const validator = new StructuredToolOutputSchemaValidatorV1019(schema);
    const invalidOutput = {
      toolName: 12345, // Should be string
      toolOutput: {
        result: "Some result",
        success: "not a boolean", // Should be boolean
      },
    };

    const result = validator.validate(invalidOutput);
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain("Expected type 'string' for property 'toolName', but received type 'number'");
    expect(result.errors).toContain("Expected type 'boolean' for property 'success', but received type 'string'");
  });
});