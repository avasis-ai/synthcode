import { describe, it, expect } from "vitest";
import { StructuredToolInputSchemaValidatorV51 } from "../src/validation/structured-tool-input-schema-validator-v51";

describe("StructuredToolInputSchemaValidatorV51", () => {
  it("should validate a correctly structured tool input", () => {
    const validator = new StructuredToolInputSchemaValidatorV51();
    const context = {
      input: {
        tool_name: "search",
        parameters: {
          query: "vitest testing",
        },
      },
      schema: {
        type: "object",
        properties: {
          tool_name: { type: "string" },
          parameters: {
            type: "object",
            properties: {
              query: { type: "string" },
            },
            required: ["query"],
          },
        },
        required: ["tool_name", "parameters"],
      },
    };
    const result = validator.validate(context);
    expect(result.isValid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it("should return errors for missing required fields", () => {
    const validator = new StructuredToolInputSchemaValidatorV51();
    const context = {
      input: {
        tool_name: "search",
        // parameters is missing
      },
      schema: {
        type: "object",
        properties: {
          tool_name: { type: "string" },
          parameters: {
            type: "object",
            properties: {
              query: { type: "string" },
            },
            required: ["query"],
          },
        },
        required: ["tool_name", "parameters"],
      },
    };
    const result = validator.validate(context);
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain("Missing required property: parameters");
  });

  it("should return errors for incorrect data types", () => {
    const validator = new StructuredToolInputSchemaValidatorV51();
    const context = {
      input: {
        tool_name: 123, // Should be string
        parameters: {
          query: "test",
        },
      },
      schema: {
        type: "object",
        properties: {
          tool_name: { type: "string" },
          parameters: {
            type: "object",
            properties: {
              query: { type: "string" },
            },
            required: ["query"],
          },
        },
        required: ["tool_name", "parameters"],
      },
    };
    const result = validator.validate(context);
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain("Invalid type for property 'tool_name': Expected string, got number");
  });
});