import { describe, it, expect } from "vitest";
import { StructuredToolOutputSchemaValidatorV1011 } from "../src/validation/structured-tool-output-schema-validator-v1011";

describe("StructuredToolOutputSchemaValidatorV1011", () => {
  it("should validate a simple object structure correctly", () => {
    const schema: any = {
      name: { type: "string", required: true },
      age: { type: "number", required: false },
      isActive: { type: "boolean", required: true },
    };
    const validator = new StructuredToolOutputSchemaValidatorV1011<any>(schema);
    const validData = { name: "Test", age: 30, isActive: true };
    const result = validator.validate(validData);
    expect(result.isValid).toBe(true);
  });

  it("should fail validation when a required string field is missing", () => {
    const schema: any = {
      name: { type: "string", required: true },
      age: { type: "number", required: false },
    };
    const validator = new StructuredToolOutputSchemaValidatorV1011<any>(schema);
    const invalidData = { age: 25 };
    const result = validator.validate(invalidData);
    expect(result.isValid).toBe(false);
    expect(result.message).toContain("name is required");
  });

  it("should fail validation when a type mismatch occurs", () => {
    const schema: any = {
      id: { type: "number", required: true },
      description: { type: "string", required: true },
    };
    const validator = new StructuredToolOutputSchemaValidatorV1011<any>(schema);
    const invalidData = { id: "not-a-number", description: "Test" };
    const result = validator.validate(invalidData);
    expect(result.isValid).toBe(false);
    expect(result.message).toContain("id must be a number");
  });
});