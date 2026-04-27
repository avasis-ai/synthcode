import { describe, it, expect } from "vitest";
import { ToolPreconditionValidatorChainV6, ValidationContext } from "../src/validation/tool-precondition-validator-chain-v6";

describe("ToolPreconditionValidatorChainV6", () => {
  it("should return valid result when all preconditions are met", async () => {
    const validator = new ToolPreconditionValidatorChainV6();
    const context: ValidationContext = {
      messages: [{ role: "user", content: "Hello" }],
      toolInputs: { toolA: "input1" },
      currentState: { step: 1 },
    };
    const result = await validator.validate(context);
    expect(result.isValid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it("should return invalid result with errors when tool inputs are missing", async () => {
    const validator = new ToolPreconditionValidatorChainV6();
    const context: ValidationContext = {
      messages: [{ role: "user", content: "Hello" }],
      toolInputs: {},
      currentState: { step: 1 },
    };
    const result = await validator.validate(context);
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain("Missing required tool input for toolA");
  });

  it("should return invalid result with errors when state is invalid", async () => {
    const validator = new ToolPreconditionValidatorChainV6();
    const context: ValidationContext = {
      messages: [{ role: "user", content: "Hello" }],
      toolInputs: { toolA: "input1" },
      currentState: { step: 0 }, // Invalid state
    };
    const result = await validator.validate(context);
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain("Invalid current state detected");
  });
});