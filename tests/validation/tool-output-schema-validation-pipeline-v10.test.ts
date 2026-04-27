import { describe, it, expect } from "vitest";
import { SchemaEvolutionValidator } from "../src/validation/tool-output-schema-validation-pipeline-v10";

describe("SchemaEvolutionValidator", () => {
  const validator = new SchemaEvolutionValidator();

  it("should return valid result for data matching schema", () => {
    const data = { name: "Test", age: 30 };
    const schema = { type: "object", properties: { name: { type: "string" }, age: { type: "number" } } };
    const result = validator.validate(data, schema);
    expect(result.isValid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it("should report errors for missing required fields", () => {
    const data = { name: "Test" };
    const schema = { type: "object", properties: { name: { type: "string" }, age: { type: "number", required: true } } };
    const result = validator.validate(data, schema);
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain("Missing required property: age");
  });

  it("should report errors for incorrect data types", () => {
    const data = { name: "Test", age: "thirty" };
    const schema = { type: "object", properties: { name: { type: "string" }, age: { type: "number" } } };
    const result = validator.validate(data, schema);
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain("Invalid type for property 'age': Expected number, got string");
  });
});