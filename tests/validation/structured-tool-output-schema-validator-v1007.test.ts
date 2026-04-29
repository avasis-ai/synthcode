import { describe, it, expect } from "vitest";
import { validateStructuredToolOutputSchema } from "../src/validation/structured-tool-output-schema-validator-v1007";

describe("validateStructuredToolOutputSchema", () => {
  it("should return true for a valid structured tool output schema", () => {
    const validSchema = {
      type: "object",
      properties: {
        toolName: { type: "string" },
        result: { type: "object", properties: { value: { type: "string" } } },
      },
      required: ["toolName", "result"],
    };
    expect(validateStructuredToolOutputSchema(validSchema)).toBe(true);
  });

  it("should return false for an invalid structured tool output schema (missing required field)", () => {
    const invalidSchema = {
      type: "object",
      properties: {
        toolName: { type: "string" },
      },
      required: ["toolName", "missingField"],
    };
    expect(validateStructuredToolOutputSchema(invalidSchema)).toBe(false);
  });

  it("should handle complex nested structures correctly", () => {
    const complexSchema = {
      type: "object",
      properties: {
        id: { type: "string" },
        data: {
          type: "array",
          items: {
            type: "object",
            properties: {
              key: { type: "string" },
              value: { type: "number" },
            },
            required: ["key", "value"],
          },
        },
      },
      required: ["id", "data"],
    };
    expect(validateStructuredToolOutputSchema(complexSchema)).toBe(true);
  });
});