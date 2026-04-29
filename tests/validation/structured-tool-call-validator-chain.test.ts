import { describe, it, expect } from "vitest";
import { ToolCallValidatorChain } from "../src/validation/structured-tool-call-validator-chain.js";
import { ToolCall, ValidationResult } from "../src/validation/tool-call-validator.js";

describe("ToolCallValidatorChain", () => {
  it("should return valid result when all validators pass", () => {
    const mockValidator1 = { validate: () => ({ isValid: true, message: "Valid 1" }) };
    const mockValidator2 = { validate: () => ({ isValid: true, message: "Valid 2" }) };
    const chain = ToolCallValidatorChain.create([mockValidator1, mockValidator2]);
    const toolCalls: ToolCall[] = [{ id: "call1", name: "funcA" }];

    const result = chain.validate(toolCalls);

    expect(result.isValid).toBe(true);
    expect(result.message).toContain("Valid 1");
    expect(result.message).toContain("Valid 2");
  });

  it("should return invalid result and the first failing message when any validator fails", () => {
    const mockValidator1 = { validate: () => ({ isValid: true, message: "Valid 1" }) };
    const mockValidator2 = { validate: () => ({ isValid: false, message: "Invalid 2" }) };
    const mockValidator3 = { validate: () => ({ isValid: false, message: "Invalid 3" }) };
    const chain = ToolCallValidatorChain.create([mockValidator1, mockValidator2, mockValidator3]);
    const toolCalls: ToolCall[] = [{ id: "call1", name: "funcA" }];

    const result = chain.validate(toolCalls);

    expect(result.isValid).toBe(false);
    expect(result.message).toContain("Invalid 2");
  });

  it("should handle an empty list of validators gracefully", () => {
    const chain = ToolCallValidatorChain.create([]);
    const toolCalls: ToolCall[] = [{ id: "call1", name: "funcA" }];

    const result = chain.validate(toolCalls);

    expect(result.isValid).toBe(true);
    expect(result.message).toBe("");
  });
});