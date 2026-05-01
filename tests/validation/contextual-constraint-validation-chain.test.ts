import { describe, it, expect } from "vitest";
import { ContextualConstraintValidationChain } from "../src/validation/contextual-constraint-validation-chain";

describe("ContextualConstraintValidationChain", () => {
  it("should return valid result when all constraints pass", () => {
    const mockContext: Context = { messages: [{ role: "user", content: "Hello" }] };
    const mockConstraints: Constraint[] = [
      { name: "ConstraintA", validate: (context) => ({ isValid: true, errors: [] }) },
      { name: "ConstraintB", validate: (context) => ({ isValid: true, errors: [] }) },
    ];
    const validator = new ContextualConstraintValidationChain();
    const result = validator.validate(mockContext, mockConstraints);
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it("should aggregate errors when one or more constraints fail", () => {
    const mockContext: Context = { messages: [{ role: "user", content: "Bad input" }] };
    const mockConstraints: Constraint[] = [
      { name: "ConstraintA", validate: (context) => ({ isValid: true, errors: [] }) },
      { name: "ConstraintB", validate: (context) => ({ isValid: false, errors: ["Error B"] }) },
      { name: "ConstraintC", validate: (context) => ({ isValid: false, errors: ["Error C"] }) },
    ];
    const validator = new ContextualConstraintValidationChain();
    const result = validator.validate(mockContext, mockConstraints);
    expect(result.isValid).toBe(false);
    expect(result.errors).toEqual(expect.arrayContaining(["Error B", "Error C"]));
    expect(result.errors).toHaveLength(2);
  });

  it("should handle an empty list of constraints gracefully", () => {
    const mockContext: Context = { messages: [] };
    const mockConstraints: Constraint[] = [];
    const validator = new ContextualConstraintValidationChain();
    const result = validator.validate(mockContext, mockConstraints);
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });
});