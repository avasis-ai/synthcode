import { describe, it, expect } from "vitest";
import { SchemaValidator } from "../src/validation/structured-tool-output-schema-validator-v1008";

describe("SchemaValidator", () => {
  it("should validate a simple string field correctly", () => {
    const schema: Record<string, any> = {
      name: { type: "string", required: true, minLength: 3 },
    };
    const validator = new SchemaValidator(schema);
    const result = validator.validate("abc", {});
    expect(result.isValid).toBe(true);
  });

  it("should fail validation for a missing required field", () => {
    const schema: Record<string, any> = {
      name: { type: "string", required: true },
    };
    const validator = new SchemaValidator(schema);
    const result = validator.validate(undefined, {});
    expect(result.isValid).toBe(false);
    expect(result.errors).toHaveLength(1);
  });

  it("should validate a nested object structure", () => {
    const schema: Record<string, any> = {
      user: {
        type: "object",
        required: true,
        properties: {
          id: { type: "number", required: true },
          email: { type: "string", required: false },
        },
      },
    };
    const validator = new SchemaValidator(schema);
    const validData = { user: { id: 123, email: "test@example.com" } };
    const result = validator.validate(validData, {});
    expect(result.isValid).toBe(true);
  });
});