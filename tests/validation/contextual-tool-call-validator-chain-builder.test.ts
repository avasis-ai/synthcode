import { describe, it, expect } from "vitest";
import { ContextualToolCallValidatorChainBuilder } from "../src/validation/contextual-tool-call-validator-chain-builder";

describe("ContextualToolCallValidatorChainBuilder", () => {
  it("should build a validator function that passes if all added validators pass", () => {
    const builder = new ContextualToolCallValidatorChainBuilder();
    const validator1: any = (toolCall: any) => ({ isValid: true });
    const validator2: any = (toolCall: any) => ({ isValid: true });

    builder.addValidator(validator1).addValidator(validator2);
    const validator = builder.build();

    const toolCall = { name: "test", input: { a: 1 } };
    const result = validator(toolCall);

    expect(result.isValid).toBe(true);
    expect(result.error).toBeUndefined();
  });

  it("should build a validator function that fails if the first validator fails", () => {
    const builder = new ContextualToolCallValidatorChainBuilder();
    const failingValidator: any = (toolCall: any) => ({ isValid: false, error: "First failed" });
    const passingValidator: any = (toolCall: any) => ({ isValid: true });

    builder.addValidator(failingValidator).addValidator(passingValidator);
    const validator = builder.build();

    const toolCall = { name: "test", input: { a: 1 } };
    const result = validator(toolCall);

    expect(result.isValid).toBe(false);
    expect(result.error).toBe("First failed");
  });

  it("should build a validator function that fails if any validator fails", () => {
    const builder = new ContextualToolCallValidatorChainBuilder();
    const validator1: any = (toolCall: any) => ({ isValid: true });
    const failingValidator: any = (toolCall: any) => ({ isValid: false, error: "Second failed" });
    const validator3: any = (toolCall: any) => ({ isValid: true });

    builder.addValidator(validator1).addValidator(failingValidator).addValidator(validator3);
    const validator = builder.build();

    const toolCall = { name: "test", input: { a: 1 } };
    const result = validator(toolCall);

    expect(result.isValid).toBe(false);
    expect(result.error).toBe("Second failed");
  });
});