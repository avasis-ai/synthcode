import { describe, it, expect } from "vitest";
import { ToolOutputSchemaValidator } from "../src/validation/tool-output-schema-validator";

describe("ToolOutputSchemaValidator", () => {
  it("should validate a simple string type correctly", () => {
    const schema: { type: "string" } = { type: "string" };
    const validator = new ToolOutputSchemaValidator(schema);
    const result = validator.validate("some string");
    expect(result.isValid).toBe(true);
    const resultInvalid = validator.validate(123);
    expect(resultInvalid.isValid).toBe(false);
    expect(resultInvalid.errors).toContain("Expected type string, but received type number");
  });

  it("should validate a simple number type correctly", () => {
    const schema: { type: "number" } = { type: "number" };
    const validator = new ToolOutputSchemaValidator(schema);
    const result = validator.validate(123);
    expect(result.isValid).toBe(true);
    const resultInvalid = validator.validate("not a number");
    expect(resultInvalid.isValid).toBe(false);
    expect(resultInvalid.errors).toContain("Expected type number, but received type string");
  });

  it("should validate a complex object schema with required fields", () => {
    const schema: {
      type: "object";
      properties: {
        id: { type: "number" };
        name: { type: "string" };
      };
      required: ["id", "name"];
    } = {
      type: "object",
      properties: {
        id: { type: "number" };
        name: { type: "string" };
      },
      required: ["id", "name"],
    };
    const validator = new ToolOutputSchemaValidator(schema);

    // Valid case
    const validData = { id: 1, name: "Test" };
    let result = validator.validate(validData);
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);

    // Missing required field case
    const missingFieldData = { id: 1 };
    result = validator.validate(missingFieldData);
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain("Missing required property: name");

    // Incorrect type case
    const wrongTypeData = { id: "1", name: "Test" };
    result = validator.validate(wrongTypeData);
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain("Expected type number for property id, but received type string");
  });
});