import { describe, it, expect } from "vitest";
import { FallbackValidator } from "../src/validation/tool-output-schema-validation-fallback";

describe("FallbackValidator", () => {
  it("should return valid when no validators are registered", () => {
    const validator = new FallbackValidator();
    const result = validator.validate({});
    expect(result.isValid).toBe(true);
    expect(result.errors).toEqual([]);
    expect(result.fallbackUsed).toBe(false);
  });

  it("should use the first validator and report its result", () => {
    const validator = new FallbackValidator();
    const mockValidator: SchemaValidator = (data) => ({ isValid: true, errors: [] });
    validator.registerFallbackValidator(mockValidator);

    const result = validator.validate({ test: "data" });
    expect(result.isValid).toBe(true);
    expect(result.errors).toEqual([]);
    expect(result.fallbackUsed).toBe(true);
  });

  it("should use the last validator if the first one fails and subsequent ones pass", () => {
    const validator = new FallbackValidator();
    const failingValidator: SchemaValidator = () => ({ isValid: false, errors: ["Error 1"] });
    const passingValidator: SchemaValidator = () => ({ isValid: true, errors: [] });

    validator.registerFallbackValidator(failingValidator);
    validator.registerFallbackValidator(passingValidator);

    const result = validator.validate({});
    expect(result.isValid).toBe(true);
    expect(result.errors).toEqual([]);
    expect(result.fallbackUsed).toBe(true);
  });
});