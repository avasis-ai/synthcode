import { describe, it, expect } from "vitest";
import { ContextualConstraintValidatorChainBuilder } from "../src/validation/contextual-constraint-validator-chain-builder-v160";

describe("ContextualConstraintValidatorChainBuilder", () => {
  it("should build a chain with a single validator correctly", () => {
    const validator = { validate: jest.fn() };
    const builder = new ContextualConstraintValidatorChainBuilder();
    const chain = builder.addValidator(validator);

    expect(chain).toBeInstanceOf(Object);
    expect(typeof chain.validate).toBe("function");
  });

  it("should build a chain with multiple validators sequentially", () => {
    const validator1 = { validate: jest.fn(() => ({ isValid: true, errors: [] })) };
    const validator2 = { validate: jest.fn(() => ({ isValid: true, errors: [] })) };
    const builder = new ContextualConstraintValidatorChainBuilder();
    const chain = builder.addValidator(validator1).addValidator(validator2);

    const context = { history: [], currentInput: {} };
    chain.validate(context);

    expect(validator1.validate).toHaveBeenCalledWith(context);
    expect(validator2.validate).toHaveBeenCalledWith(context);
  });

  it("should return a chain that aggregates errors from all validators", () => {
    const validator1 = { validate: jest.fn(() => ({ isValid: false, errors: ["Error 1"] })) };
    const validator2 = { validate: jest.fn(() => ({ isValid: false, errors: ["Error 2"] })) };
    const builder = new ContextualConstraintValidatorChainBuilder();
    const chain = builder.addValidator(validator1).addValidator(validator2);

    const context = { history: [], currentInput: {} };
    const result = chain.validate(context);

    expect(result.isValid).toBe(false);
    expect(result.errors).toEqual(["Error 1", "Error 2"]);
  });
});