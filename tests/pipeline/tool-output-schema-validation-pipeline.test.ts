import { describe, it, expect } from "vitest";
import { SchemaValidator } from "../src/pipeline/tool-output-schema-validation-pipeline";

describe("SchemaValidator", () => {
  it("should validate a simple object structure correctly", () => {
    const schema: Schema = {
      id: { type: "number", required: true },
      name: { type: "string", required: true },
      isActive: { type: "boolean", required: false },
    };
    const validator = new SchemaValidator();
    const result = validator.validate({ id: 123, name: "Test", isActive: true }, schema);
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it("should report errors for missing required fields", () => {
    const schema: Schema = {
      userId: { type: "number", required: true },
      username: { type: "string", required: true },
    };
    const validator = new SchemaValidator();
    const result = validator.validate({ userId: 123 }, schema);
    expect(result.isValid).toBe(false);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0].field).toBe("username");
  });

  it("should validate an array structure against item schema", () => {
    const schema: Schema = {
      items: {
        type: "array",
        items: {
          type: "object",
          properties: {
            itemId: { type: "number", required: true },
          },
        },
      },
    };
    const validator = new SchemaValidator();
    const validOutput = [{ itemId: 1 }, { itemId: 2 }];
    const result = validator.validate(validOutput, schema);
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });
});