import { describe, it, expect } from "vitest";
import { validateStructuredToolOutputSchema } from "../src/validation/structured-tool-output-schema-validator-v103_advanced";

describe("validateStructuredToolOutputSchema", () => {
  it("should return true for a valid, simple object schema", () => {
    const schema = {
      type: "object",
      properties: {
        id: { type: "string" },
        isActive: { type: "boolean" },
      },
      required: ["id", "isActive"],
    };
    const result = validateStructuredToolOutputSchema(schema);
    expect(result.isValid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it("should detect missing required properties in a complex object schema", () => {
    const schema = {
      type: "object",
      properties: {
        name: { type: "string" },
        count: { type: "number" },
      },
      required: ["name", "count"],
    };
    // Intentionally pass a schema that is missing 'required' definition for testing error path
    // We simulate the validator checking for required fields when they are missing in the definition itself
    const invalidSchema = {
        type: "object",
        properties: {
            name: { type: "string" },
            count: { type: "number" },
        }
        // Missing 'required' array entirely, which might be an error depending on strictness
    };
    const result = validateStructuredToolOutputSchema(invalidSchema);
    // Depending on the implementation, this might fail validation if 'required' is mandatory for object type
    expect(result.isValid).toBe(false);
    expect(result.errors).toContainEqual(expect.stringContaining("Object schema must specify 'required' fields"));
  });

  it("should correctly validate an array schema with defined item types", () => {
    const schema = {
      type: "array",
      items: {
        type: "object",
        properties: {
          key: { type: "string" },
          value: { type: "number" },
        },
        required: ["key", "value"],
      },
    };
    const result = validateStructuredToolOutputSchema(schema);
    expect(result.isValid).toBe(true);
    expect(result.errors).toEqual([]);
  });
});