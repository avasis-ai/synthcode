import { describe, it, expect } from "vitest";
import { SchemaValidator } from "../src/validation/structured-tool-output-schema-validator-v1012";

describe("SchemaValidator", () => {
  it("should validate a simple object structure correctly", () => {
    const schema = {
      requiredFields: ["name", "age"],
      fieldConstraints: {
        name: { type: "string", required: true },
        age: { type: "number", required: true },
      },
    };
    const validator = new SchemaValidator(schema);
    const validData = { name: "Test", age: 30 };
    expect(validator.validate(validData)).toBe(true);
  });

  it("should fail validation when required fields are missing", () => {
    const schema = {
      requiredFields: ["name", "age"],
      fieldConstraints: {
        name: { type: "string", required: true },
        age: { type: "number", required: true },
      },
    };
    const validator = new SchemaValidator(schema);
    const invalidData = { name: "Test" };
    expect(validator.validate(invalidData)).toBe(false);
  });

  it("should fail validation when data types do not match schema", () => {
    const schema = {
      requiredFields: ["name", "age"],
      fieldConstraints: {
        name: { type: "string", required: true },
        age: { type: "number", required: true },
      },
    };
    const validator = new SchemaValidator(schema);
    const invalidData = { name: "Test", age: "thirty" };
    expect(validator.validate(invalidData)).toBe(false);
  });
});