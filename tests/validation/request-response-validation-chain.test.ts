import { describe, it, expect } from "vitest";
import { RequestResponseValidatorChain, ValidationContext } from "../src/validation/request-response-validation-chain";

describe("RequestResponseValidatorChain", () => {
  it("should correctly validate when all steps pass", () => {
    const mockContext: ValidationContext = {
      request: { id: 1, data: "test" },
      response: { success: true, data: "ok" },
      context: { user: "testuser" },
    };
    const validator = new RequestResponseValidatorChain([
      (context) => ({ isValid: true, errors: [] }),
      (context) => ({ isValid: true, errors: [] }),
    ]);
    const result = validator.validate(mockContext);
    expect(result.isValid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it("should accumulate all errors from multiple failing steps", () => {
    const mockContext: ValidationContext = {
      request: { id: 2, data: "fail" },
      response: { success: false, error: "bad" },
      context: { user: "failuser" },
    };
    const validator = new RequestResponseValidatorChain([
      (context) => ({
        isValid: false,
        errors: [{ stepName: "Step1", message: "Request ID missing" }],
      }),
      (context) => ({
        isValid: false,
        errors: [{ stepName: "Step2", message: "Response status invalid" }],
      }),
    ]);
    const result = validator.validate(mockContext);
    expect(result.isValid).toBe(false);
    expect(result.errors).toHaveLength(2);
    expect(result.errors).toEqual(
      expect.arrayContaining([
        { stepName: "Step1", message: "Request ID missing" },
        { stepName: "Step2", message: "Response status invalid" },
      ])
    );
  });

  it("should return an empty error list if no steps are provided", () => {
    const mockContext: ValidationContext = {
      request: {},
      response: {},
      context: {},
    };
    const validator = new RequestResponseValidatorChain([]);
    const result = validator.validate(mockContext);
    expect(result.isValid).toBe(true);
    expect(result.errors).toEqual([]);
  });
});