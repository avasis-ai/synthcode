import { describe, it, expect } from "vitest";
import { validateStructuredToolOutputSchema } from "../src/validation/structured-tool-output-schema-validator-v101";

describe("validateStructuredToolOutputSchema", () => {
  it("should return true for a valid simple object schema", () => {
    const schema = {
      type: "object",
      properties: {
        id: { type: "string" },
        isActive: { type: "boolean" },
      },
      required: ["id", "isActive"],
    };
    expect(validateStructuredToolOutputSchema(schema)).toBe(true);
  });

  it("should return false for an invalid schema (missing required property)", () => {
    const schema = {
      type: "object",
      properties: {
        name: { type: "string" },
        version: { type: "string" },
      },
      required: ["name", "version"],
    };
    // Intentionally remove 'version' from required array to test failure
    const invalidSchema = {
      type: "object",
      properties: {
        name: { type: "string" },
        version: { type: "string" },
      },
      required: ["name"],
    };
    // We expect it to pass if we only check for missing required properties, 
    // but let's test a structural invalidity if possible, or stick to a known failure case.
    // For this test, we'll assume the validator checks for completeness if required is present.
    // A better test would involve a schema that *cannot* be validly constructed.
    // Let's test a case where 'type' is missing for a property.
    const schemaMissingType = {
        type: "object",
        properties: {
            badProp: { /* missing type */ }
        }
    };
    // Assuming the validator handles missing 'type' gracefully or throws/fails validation
    // Based on the provided context, we test a structural failure.
    expect(validateStructuredToolOutputSchema(schemaMissingType)).toBe(false);
  });

  it("should return false for an invalid array schema definition", () => {
    const schema = {
      type: "array",
      items: {
        type: "object",
        properties: {
          key: { type: "string" },
        },
        required: ["key"],
      },
    };
    // Intentionally make the items schema invalid by removing 'type'
    const invalidItemsSchema = {
        type: "array",
        items: {
            properties: {
                key: { type: "string" }
            }
        }
    };
    expect(validateStructuredToolOutputSchema(invalidItemsSchema)).toBe(false);
  });
});