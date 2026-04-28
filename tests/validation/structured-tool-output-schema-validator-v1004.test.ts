import { describe, it, expect } from "vitest";
import { SchemaDefinition, FieldSchema } from "../src/validation/structured-tool-output-schema-validator-v1004";
import { StructuredToolOutputSchemaValidator } from "../src/validation/structured-tool-output-schema-validator-v1004";

describe("StructuredToolOutputSchemaValidator", () => {
  it("should validate a simple object structure correctly", () => {
    const schema: SchemaDefinition = {
      type: "object",
      properties: {
        name: { type: "string", required: true },
        age: { type: "number", required: false },
      },
      required: ["name"],
    };
    const validator = new StructuredToolOutputSchemaValidator(schema);
    expect(validator.isValid({ name: "TestUser", age: 30 })).toBe(true);
    expect(validator.isValid({ name: "TestUser" })).toBe(true);
  });

  it("should fail validation when required fields are missing", () => {
    const schema: SchemaDefinition = {
      type: "object",
      properties: {
        name: { type: "string", required: true },
        email: { type: "string", required: true },
      },
      required: ["name", "email"],
    };
    const validator = new StructuredToolOutputSchemaValidator(schema);
    expect(validator.isValid({ name: "TestUser" })).toBe(false);
  });

  it("should handle custom dependency constraints", () => {
    const schema: SchemaDefinition = {
      type: "object",
      properties: {
        fieldA: { type: "string", required: true },
        fieldB: { type: "string", required: true },
      },
      required: ["fieldA", "fieldB"],
      dependencies: [
        {
          dependsOn: "fieldA",
          constraint: (a: any, b: any) => a !== "A" || b === "B",
          message: "If fieldA is 'A', fieldB must be 'B'",
        },
      ],
    };
    const validator = new StructuredToolOutputSchemaValidator(schema);
    // Valid case
    expect(validator.isValid({ fieldA: "B", fieldB: "X" })).toBe(true);
    // Invalid case based on dependency
    expect(validator.isValid({ fieldA: "A", fieldB: "C" })).toBe(false);
  });
});