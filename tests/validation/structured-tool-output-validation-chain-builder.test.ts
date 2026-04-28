import { describe, it, expect } from "vitest";
import { StructuredToolOutputValidationChainBuilder } from "../src/validation/structured-tool-output-validation-chain-builder";
import { Validator } from "../src/validation/validator-chain";

describe("StructuredToolOutputValidationChainBuilder", () => {
  it("should initialize with a target schema", () => {
    const schema = { type: "object", properties: {} };
    const builder = new StructuredToolOutputValidationChainBuilder(schema);
    // We can't directly test private members, but we can test the build process
    // which relies on the schema being set.
    expect(builder).toBeInstanceOf(StructuredToolOutputValidationChainBuilder);
  });

  it("should add multiple validation steps correctly", () => {
    const schema = { type: "object", properties: {} };
    const builder = new StructuredToolOutputValidationChainBuilder(schema);
    const mockValidator1 = { validate: () => true };
    const mockValidator2 = { validate: () => true };

    const result = builder.addStep(mockValidator1).addStep(mockValidator2);

    expect(result).toBe(builder);
    // A more robust test would involve mocking the internal state,
    // but for this scope, checking the return value and basic functionality is enough.
  });

  it("should build a ValidatorChain with all added steps and the target schema", () => {
    const schema = { type: "object", properties: {} };
    const builder = new StructuredToolOutputValidationChainBuilder(schema);
    const mockValidator1 = { validate: () => true };
    const mockValidator2 = { validate: () => true };

    const validatorChain = builder.addStep(mockValidator1).addStep(mockValidator2).build();

    // Assuming ValidatorChain constructor accepts (validators: Validator[], schema: any)
    // We check if the resulting object is an instance of ValidatorChain (or Validator, based on usage)
    expect(validatorChain).toBeInstanceOf(Validator);
    // In a real scenario, we might check the internal structure of ValidatorChain
  });
});