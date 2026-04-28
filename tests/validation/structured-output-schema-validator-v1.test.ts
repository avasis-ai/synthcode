import { describe, it, expect } from "vitest";
import { StructuredOutputSchemaValidatorV1 } from "../src/validation/structured-output-schema-validator-v1";
import { Schema } from "../src/validation/types";

describe("StructuredOutputSchemaValidatorV1", () => {
  it("should return isValid true for valid data", () => {
    const schema: Schema = {
      type: "object",
      properties: {
        name: { type: "string" },
        age: { type: "number" },
      },
      required: ["name", "age"],
    };
    const validator = new StructuredOutputSchemaValidatorV1(schema);
    const data = { name: "Test User", age: 30 };
    const result = validator.validate(data);
    expect(result.isValid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it("should return isValid false and list errors for missing required fields", () => {
    const schema: Schema = {
      type: "object",
      properties: {
        name: { type: "string" },
        age: { type: "number" },
      },
      required: ["name", "age"],
    };
    const validator = new StructuredOutputSchemaValidatorV1(schema);
    const data = { name: "Test User" }; // Missing age
    const result = validator.validate(data);
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain("Missing required property: age");
  });

  it("should return isValid false and list errors for incorrect data types", () => {
    const schema: Schema = {
      type: "object",
      properties: {
        name: { type: "string" },
        age: { type: "number" },
      },
      required: ["name", "age"],
    };
    const validator = new StructuredOutputSchemaValidatorV1(schema);
    const data = { name: 123, age: "twenty" }; // Incorrect types
    const result = validator.validate(data);
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain("Expected type 'string' for property 'name', but received type 'number'");
    expect(result.errors).toContain("Expected type 'number' for property 'age', but received type 'string'");
  });
});