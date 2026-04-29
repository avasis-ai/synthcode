import { describe, it, expect } from "vitest";
import { validateStructuredToolOutputSchema } from "../src/validation/structured-tool-output-schema-validator-v1009";

describe("validateStructuredToolOutputSchema", () => {
  it("should return true for a valid simple object schema", () => {
    const schema = {
      type: "object",
      properties: {
        id: { type: "string" },
        count: { type: "number" },
      },
      required: ["id", "count"],
    };
    expect(validateStructuredToolOutputSchema(schema)).toBe(true);
  });

  it("should return false for an invalid object schema (missing required property)", () => {
    const schema = {
      type: "object",
      properties: {
        id: { type: "string" },
        count: { type: "number" },
      },
      required: ["id", "missing"],
    };
    expect(validateStructuredToolOutputSchema(schema)).toBe(false);
  });

  it("should return true for a valid array schema", () => {
    const schema = {
      type: "array",
      items: {
        type: "object",
        properties: {
          name: { type: "string" },
        },
        required: ["name"],
      },
    };
    expect(validateStructuredToolOutputSchema(schema)).toBe(true);
  });
});