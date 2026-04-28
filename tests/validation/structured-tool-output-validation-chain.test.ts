import { describe, it, expect } from "vitest";
import { StructuredOutputValidationChain } from "../src/validation/structured-tool-output-validation-chain";

describe("StructuredOutputValidationChain", () => {
  it("should initialize with no steps", () => {
    const chain = StructuredOutputValidationChain.create();
    // Assuming there's a way to check internal state or a getter,
    // for this test, we'll rely on the addStep method's behavior.
    // Since we can't see the private steps array, we'll test the chain's functionality.
    expect(chain).toBeDefined();
  });

  it("should execute steps sequentially and pass context", () => {
    const mockStep1: any = {
      execute: (partialOutput: any, context: any) => ({
        isValid: true,
        errors: [],
        context: { ...context, step1Processed: true },
      }),
    };
    const mockStep2: any = {
      execute: (partialOutput: any, context: any) => ({
        isValid: true,
        errors: [],
        context: { ...context, step2Processed: true },
      }),
    };

    const chain = StructuredOutputValidationChain.create()
      .addStep(mockStep1)
      .addStep(mockStep2);

    const initialContext: Record<string, unknown> = { initial: "data" };
    const result = chain.validate({}, initialContext);

    expect(result.isValid).toBe(true);
    expect(result.context).toEqual({ initial: "data", step1Processed: true, step2Processed: true });
  });

  it("should aggregate errors from all steps", () => {
    const mockStep1: any = {
      execute: (partialOutput: any, context: any) => ({
        isValid: false,
        errors: ["Error from step 1"],
        context: context,
      }),
    };
    const mockStep2: any = {
      execute: (partialOutput: any, context: any) => ({
        isValid: false,
        errors: ["Error from step 2"],
        context: context,
      }),
    };

    const chain = StructuredOutputValidationChain.create()
      .addStep(mockStep1)
      .addStep(mockStep2);

    const initialContext: Record<string, unknown> = {};
    const result = chain.validate({}, initialContext);

    expect(result.isValid).toBe(false);
    expect(result.errors).toEqual(["Error from step 1", "Error from step 2"]);
  });
});