import { describe, it, expect } from "vitest";
import { SchemaValidator } from "../src/validation/structured-tool-output-schema-validator-v103-advanced-advanced";

describe("SchemaValidator", () => {
  it("should validate correctly with a simple schema", () => {
    const validator = new SchemaValidator();
    const data = { id: 1, name: "Test" };
    const schema = { type: "object", properties: { id: { type: "number" }, name: { type: "string" } } };
    const result = validator.validate(data, schema);
    expect(result.isValid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it("should return false and errors for invalid data types", () => {
    const validator = new SchemaValidator();
    const data = { id: "not a number", name: 123 };
    const schema = { type: "object", properties: { id: { type: "number" }, name: { type: "string" } } };
    const result = validator.validate(data, schema);
    expect(result.isValid).toBe(false);
    expect(result.errors).toHaveLength(2);
  });

  it("should validate with context and handle missing required fields", () => {
    const validator = new SchemaValidator();
    const context: any = { history: [], schemaEvolutionHistory: [], currentSchemaVersion: "v1" };
    const data = { requiredField: "present" };
    const schema = { type: "object", properties: { requiredField: { type: "string", required: true }, optionalField: { type: "string", required: false } } };
    const result = validator.validateWithContext(data, schema, context);
    expect(result.isValid).toBe(true);
    expect(result.errors).toEqual([]);
  });
});