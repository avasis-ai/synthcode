import { describe, it, expect } from "vitest";
import { ToolPreconditionValidatorChain } from "../src/validation/tool-precondition-validator-chain-builder";
import { Message } from "../src/validation/types";

describe("ToolPreconditionValidatorChain", () => {
  it("should correctly build and validate a chain of validators when all conditions are met", () => {
    const mockContext: { messages: Message[] } = { messages: [{ content: "Hello" }] };
    const validator1: (context: { messages: Message[] }) => boolean = () => true;
    const validator2: (context: { messages: Message[] }) => boolean = () => true;

    const chain = new ToolPreconditionValidatorChain([
      { validator: validator1, condition: () => true, mandatory: true },
      { validator: validator2, condition: () => true, mandatory: true },
    ]);

    const isValid = chain.isValid(mockContext);
    expect(isValid).toBe(true);
  });

  it("should return false if any mandatory validator fails", () => {
    const mockContext: { messages: Message[] } = { messages: [] };
    const failingValidator: (context: { messages: Message[] }) => boolean = () => false;

    const chain = new ToolPreconditionValidatorChain([
      { validator: () => true, condition: () => true, mandatory: true },
      { validator: failingValidator, condition: () => true, mandatory: true },
    ]);

    const isValid = chain.isValid(mockContext);
    expect(isValid).toBe(false);
  });

  it("should return true if a non-mandatory validator fails but others pass", () => {
    const mockContext: { messages: Message[] } = { messages: [] };
    const passingValidator: (context: { messages: Message[] }) => boolean = () => true;
    const failingValidator: (context: { messages: Message[] }) => boolean = () => false;

    const chain = new ToolPreconditionValidatorChain([
      { validator: passingValidator, condition: () => true, mandatory: true },
      { validator: failingValidator, condition: () => true, mandatory: false },
    ]);

    const isValid = chain.isValid(mockContext);
    expect(isValid).toBe(true);
  });
});