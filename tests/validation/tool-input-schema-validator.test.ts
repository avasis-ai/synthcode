import { describe, it, expect } from "vitest";
import { SchemaValidator } from "../src/validation/tool-input-schema-validator";
import { z } from "zod";

describe("SchemaValidator", () => {
  it("should return isValid: true and empty errors for valid input", () => {
    const schema = z.object({
      name: z.string().min(1),
      age: z.number().int().positive(),
    });
    const validator = new SchemaValidator(schema);
    const input = { name: "Test", age: 30 };
    const result = validator.validate(input);
    expect(result.isValid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it("should return isValid: false and correct errors for invalid input (missing field)", () => {
    const schema = z.object({
      name: z.string().min(1),
      age: z.number().int().positive(),
    });
    const validator = new SchemaValidator(schema);
    const input = { name: "Test" }; // Missing age
    const result = validator.validate(input);
    expect(result.isValid).toBe(false);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0].path).toBe("age");
    expect(result.errors[0].message).toContain("Required");
  });

  it("should return isValid: false and correct errors for invalid input (wrong type)", () => {
    const schema = z.object({
      name: z.string().min(1),
      age: z.number().int().positive(),
    });
    const validator = new SchemaValidator(schema);
    const input = { name: "Test", age: "not a number" };
    const result = validator.validate(input);
    expect(result.isValid).toBe(false);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0].path).toBe("age");
    expect(result.errors[0].message).toContain("Expected number");
  });
});