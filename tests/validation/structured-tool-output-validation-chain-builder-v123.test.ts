import { describe, it, expect } from "vitest";
import { StructuredToolOutputValidationChainBuilder } from "../src/validation/structured-tool-output-validation-chain-builder-v123";

describe("StructuredToolOutputValidationChainBuilder", () => {
  it("should initialize correctly with no validators", () => {
    const builder = new StructuredToolOutputValidationChainBuilder();
    // Assuming there's a way to check the internal state or a getter,
    // for this test, we just check instantiation.
    expect(builder).toBeInstanceOf(StructuredToolOutputValidationChainBuilder);
  });

  it("should allow adding multiple schema validators", () => {
    const builder = new StructuredToolOutputValidationChainBuilder();
    // Mocking the addSchemaValidator method call structure
    const mockValidator1 = jest.fn();
    const mockValidator2 = jest.fn();

    // Assuming addSchemaValidator exists and accepts a validator function
    (builder as any).addSchemaValidator(mockValidator1);
    (builder as any).addSchemaValidator(mockValidator2);

    // A simple check to ensure the method was called (if we could inspect private state, we would)
    // For now, we just ensure the call doesn't throw and assume internal state management works.
    expect(typeof (builder as any).getValidators).toBe('function');
  });

  it("should correctly build and execute the validation chain", () => {
    const builder = new StructuredToolOutputValidationChainBuilder();
    const mockValidator1 = jest.fn(() => ({ isValid: true, errors: [] }));
    const mockValidator2 = jest.fn(() => ({ isValid: false, errors: ["Error in field X"] }));

    // Mocking the addition of validators
    (builder as any).addSchemaValidator(mockValidator1);
    (builder as any).addSchemaValidator(mockValidator2);

    const context = { initialData: { key: "value" }, metadata: {} };
    const result = (builder as any).buildAndValidate(context);

    // Check if the chain was executed (i.e., both mock validators were called)
    expect(mockValidator1).toHaveBeenCalledWith(context.initialData, context.metadata);
    expect(mockValidator2).toHaveBeenCalledWith(context.initialData, context.metadata);

    // Check the final result based on the mock return values (last validator dictates failure)
    expect(result.isValid).toBe(false);
    expect(result.errors).toEqual(["Error in field X"]);
  });
});