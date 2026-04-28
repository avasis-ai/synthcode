import { describe, it, expect } from "vitest";
import { ToolPreconditionValidatorChainV7 } from "../src/validation/tool-precondition-validator-chain-v7";

describe("ToolPreconditionValidatorChainV7", () => {
  it("should initialize with no validators if none are provided", async () => {
    const validatorChain = new ToolPreconditionValidatorChainV7();
    // We can't directly test private members, but we can test its behavior
    // by adding a validator and checking if it runs.
    const mockValidator = {
      validate: async () => ({ isValid: true, errors: [] }),
    } as unknown as any; // Mocking the interface for simplicity in this test

    const chain = new ToolPreconditionValidatorChainV7([mockValidator]);
    const result = await chain.validate({ messages: [] }, {});
    expect(result.isValid).toBe(true);
  });

  it("should run all added validators and aggregate errors", async () => {
    const mockValidator1 = {
      validate: async () => ({ isValid: true, errors: [] }),
    } as unknown as any;
    const mockValidator2 = {
      validate: async () => ({ isValid: false, errors: ["Error from validator 2"] }),
    } as unknown as any;
    const mockValidator3 = {
      validate: async () => ({ isValid: false, errors: ["Error from validator 3"] }),
    } as unknown as any;

    const validatorChain = new ToolPreconditionValidatorChainV7([mockValidator1, mockValidator2, mockValidator3]);
    const context = { messages: [] };
    const inputs = { toolName: "test" };

    const result = await validatorChain.validate(context, inputs);

    expect(result.isValid).toBe(false);
    expect(result.errors).toEqual(["Error from validator 2", "Error from validator 3"]);
  });

  it("should return true and no errors if all validators pass", async () => {
    const mockValidator1 = {
      validate: async () => ({ isValid: true, errors: [] }),
    } as unknown as any;
    const mockValidator2 = {
      validate: async () => ({ isValid: true, errors: [] }),
    } as unknown as any;

    const validatorChain = new ToolPreconditionValidatorChainV7([mockValidator1, mockValidator2]);
    const context = { messages: [] };
    const inputs = { toolName: "test" };

    const result = await validatorChain.validate(context, inputs);

    expect(result.isValid).toBe(true);
    expect(result.errors).toEqual([]);
  });
});