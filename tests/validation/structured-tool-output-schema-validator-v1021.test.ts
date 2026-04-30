import { describe, it, expect } from "vitest";
import { SchemaValidator } from "../src/validation/structured-tool-output-schema-validator-v1021";

describe("SchemaValidator", () => {
  it("should validate a simple object structure correctly", async () => {
    const schema = {
      type: "object",
      properties: {
        id: { type: "number", required: true },
        name: { type: "string", required: true },
      },
      required: ["id", "name"],
    };
    const validator = new SchemaValidator(schema);
    const result = await validator.validate({ id: 123, name: "Test" });
    expect(result.isValid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it("should fail validation when a required field is missing", async () => {
    const schema = {
      type: "object",
      properties: {
        id: { type: "number", required: true },
        name: { type: "string", required: true },
      },
      required: ["id", "name"],
    };
    const validator = new SchemaValidator(schema);
    const result = await validator.validate({ id: 123 }); // Missing name
    expect(result.isValid).toBe(false);
    expect(result.errors).toHaveLength(1);
  });

  it("should handle type validation for string and number fields", async () => {
    const schema = {
      type: "object",
      properties: {
        count: { type: "number", required: true },
        description: { type: "string", required: true },
      },
      required: ["count", "description"],
    };
    const validator = new SchemaValidator(schema);
    const result = await validator.validate({ count: 42, description: "A valid description" });
    expect(result.isValid).toBe(true);

    const invalidResult = await validator.validate({ count: "not a number", description: "ok" });
    expect(invalidResult.isValid).toBe(false);
  });
});