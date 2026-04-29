import { describe, it, expect } from "vitest";
import { ContextSchemaValidator } from "../src/validation/context-schema-validator";

describe("ContextSchemaValidator", () => {
  it("should validate correctly when all required fields are present and valid", () => {
    const schema = {
      requiredFields: ["name", "age"],
      fieldValidators: {
        name: (value: unknown) => ({ isValid: typeof value === "string" && value.length > 0, message: "Name must be a non-empty string." }),
        age: (value: unknown) => ({ isValid: typeof value === "number" && value >= 0, message: "Age must be a non-negative number." }),
      },
    };
    const validator = new ContextSchemaValidator(schema);
    const context = { name: "Test User", age: 30 };
    const result = validator.validate(context);
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it("should report errors for missing required fields", () => {
    const schema = {
      requiredFields: ["name", "age"],
      fieldValidators: {
        name: (value: unknown) => ({ isValid: typeof value === "string" && value.length > 0, message: "Name must be a non-empty string." }),
        age: (value: unknown) => ({ isValid: typeof value === "number" && value >= 0, message: "Age must be a non-negative number." }),
      },
    };
    const validator = new ContextSchemaValidator(schema);
    const context = { name: "Test User" }; // Missing age
    const result = validator.validate(context);
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain("Missing required field: age");
  });

  it("should report errors for invalid values in required fields", () => {
    const schema = {
      requiredFields: ["name", "age"],
      fieldValidators: {
        name: (value: unknown) => ({ isValid: typeof value === "string" && value.length > 0, message: "Name must be a non-empty string." }),
        age: (value: unknown) => ({ isValid: typeof value === "number" && value >= 0, message: "Age must be a non-negative number." }),
      },
    };
    const validator = new ContextSchemaValidator(schema);
    const context = { name: "", age: -5 }; // Empty name, negative age
    const result = validator.validate(context);
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain("Validation failed for field 'name': Name must be a non-empty string.");
    expect(result.errors).toContain("Validation failed for field 'age': Age must be a non-negative number.");
  });
});