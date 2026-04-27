import { describe, it, expect } from "vitest";
import { ToolPreconditionValidatorChainV4 } from "../src/validation/tool-precondition-validator-chain-v4";

// Mock validator implementations for testing
const mockValidator1: any = {
  validate: (context: Record<string, unknown>) => ({
    isValid: true,
    errors: [],
    contextUpdates: { key1: "value1" },
  }),
};

const mockValidator2: any = {
  validate: (context: Record<string, unknown>) => ({
    isValid: true,
    errors: [],
    contextUpdates: { key2: "value2" },
  }),
};

const mockFailingValidator: any = {
  validate: (context: Record<string, unknown>) => ({
    isValid: false,
    errors: ["Validation failed for specific field."],
    contextUpdates: {},
  }),
};

describe("ToolPreconditionValidatorChainV4", () => {
  it("should return valid result when all validators pass", () => {
    const validatorChain = new ToolPreconditionValidatorChainV4([
      mockValidator1,
      mockValidator2,
    ]);
    const result = validatorChain.validate({});
    expect(result.isValid).toBe(true);
    expect(result.errors).toEqual([]);
    // Check if context updates from all validators are merged (assuming merge behavior)
    expect(Object.keys(result.contextUpdates)).toHaveLength(2);
  });

  it("should return invalid result and aggregate errors when any validator fails", () => {
    const validatorChain = new ToolPreconditionValidatorChainV4([
      mockValidator1,
      mockFailingValidator,
      mockValidator2,
    ]);
    const result = validatorChain.validate({});
    expect(result.isValid).toBe(false);
    expect(result.errors).toEqual(["Validation failed for specific field."]);
  });

  it("should correctly process context updates from multiple validators", () => {
    const validatorChain = new ToolPreconditionValidatorChainV4([
      { validate: (context: Record<string, unknown>) => ({ isValid: true, errors: [], contextUpdates: { user: "A" } }) },
      { validate: (context: Record<string, unknown>) => ({ isValid: true, errors: [], contextUpdates: { user: "B" } }) },
    ]);
    const result = validatorChain.validate({});
    expect(result.contextUpdates.user).toBe("B"); // Expecting the last one to overwrite or merge correctly
  });
});