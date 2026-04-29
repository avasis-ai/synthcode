import { describe, it, expect } from "vitest";
import { ContextualOutputValidator } from "../src/validation/contextual-output-schema-validator";

describe("ContextualOutputValidator", () => {
  it("should validate data correctly when context is valid", () => {
    const validator = new ContextualOutputValidator<string>(
      (context, data) => ({ isValid: true, message: "Valid" })
    );
    const result = validator.validate("some data");
    expect(result.isValid).toBe(true);
  });

  it("should report invalid when context rule fails", () => {
    const validator = new ContextualOutputValidator<string>(
      (context, data) => ({ isValid: false, message: "Invalid context" })
    );
    const result = validator.validate("some data");
    expect(result.isValid).toBe(false);
    expect(result.message).toBe("Invalid context");
  });

  it("should handle different data types for validation", () => {
    const validator = new ContextualOutputValidator<number>(
      (context, data) => ({ isValid: true, message: "Number valid" })
    );
    const result = validator.validate(123);
    expect(result.isValid).toBe(true);
  });
});