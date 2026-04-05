import { describe, it, expect } from "vitest";
import { ContextualValidatorChain } from "../src/validation/structured-tool-input-validation";

describe("ContextualValidatorChain", () => {
  it("should return the same instance when addValidator is called multiple times", () => {
    const chain = new ContextualValidatorChain<any>();
    const result = chain.addValidator(() => {});
    expect(result).toBe(chain);
  });

  it("should run all added validators and return the result of the last one", async () => {
    const mockValidator1 = {
      validate: jest.fn(() => ({ isValid: true, message: "Valid 1" })),
    };
    const mockValidator2 = {
      validate: jest.fn(() => ({ isValid: false, message: "Invalid 2" })),
    };
    const chain = new ContextualValidatorChain<any>();
    chain.addValidator(mockValidator1 as any);
    chain.addValidator(mockValidator2 as any);

    const context = {} as any;
    const input = {} as any;
    const result = chain.validate(context, input);

    expect(mockValidator1.validate).toHaveBeenCalledWith(context, input);
    expect(mockValidator2.validate).toHaveBeenCalledWith(context, input);
    expect(result).toEqual({ isValid: false, message: "Invalid 2" });
  });

  it("should return a default invalid result if no validators are added", async () => {
    const chain = new ContextualValidatorChain<any>();
    const context = {} as any;
    const input = {} as any;
    const result = chain.validate(context, input);

    expect(result).toEqual({ isValid: true, message: "No validators added" });
  });
});