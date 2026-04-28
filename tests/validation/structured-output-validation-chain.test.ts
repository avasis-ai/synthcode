import { describe, it, expect } from "vitest";
import { StructuredOutputValidationChain } from "../src/validation/structured-output-validation-chain";

describe("StructuredOutputValidationChain", () => {
  it("should return valid when all steps pass validation", () => {
    const mockStep1: any = { validate: (data: any, context: any) => ({ isValid: true, data: { step1: data } }) };
    const mockStep2: any = { validate: (data: any, context: any) => ({ isValid: true, data: { step2: data } }) };
    const chain = new StructuredOutputValidationChain([mockStep1, mockStep2]);

    const result = chain.validate({ initial: true }, {});

    expect(result.isValid).toBe(true);
    expect(result.error).toBeUndefined();
  });

  it("should stop and report error on the first failing step", () => {
    const mockStep1: any = { validate: (data: any, context: any) => ({ isValid: true, data: { step1: data } }) };
    const mockStep2: any = { validate: (data: any, context: any) => ({ isValid: false, error: "Validation failed in step 2" }) };
    const mockStep3: any = { validate: (data: any, context: any) => ({ isValid: true, data: { step3: data } }) };
    const chain = new StructuredOutputValidationChain([mockStep1, mockStep2, mockStep3]);

    const result = chain.validate({ initial: true }, {});

    expect(result.isValid).toBe(false);
    expect(result.error).toBe("Validation failed in step 2");
  });

  it("should pass through the data from the last successful step", () => {
    const mockStep1: any = { validate: (data: any, context: any) => ({ isValid: true, data: { step1: data } }) };
    const mockStep2: any = { validate: (data: any, context: any) => ({ isValid: true, data: { step2: data } }) };
    const chain = new StructuredOutputValidationChain([mockStep1, mockStep2]);

    const result = chain.validate({ initial: true }, {});

    expect(result.isValid).toBe(true);
    expect(result.data).toEqual({ step2: { step2: { step1: true } } });
  });
});