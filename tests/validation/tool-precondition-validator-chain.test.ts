import { describe, it, expect } from "vitest";
import { ToolPreconditionValidatorChain } from "../src/validation/tool-precondition-validator-chain";
import { ToolContext } from "../src/validation/tool-context";

describe("ToolPreconditionValidatorChain", () => {
  it("should return success if all validators pass", async () => {
    const mockValidator1: PreconditionValidator = {
      validate: async (context: ToolContext) => ({ isValid: true, message: "Valid 1" }),
    };
    const mockValidator2: PreconditionValidator = {
      validate: async (context: ToolContext) => ({ isValid: true, message: "Valid 2" }),
    };
    const chain = new ToolPreconditionValidatorChain([mockValidator1, mockValidator2]);
    const context: ToolContext = { toolName: "test-tool" };

    const result = await chain.validateAll(context);
    expect(result.isValid).toBe(true);
    expect(result.message).toBe("All preconditions met.");
  });

  it("should return failure with the first failing validator's message", async () => {
    const mockValidator1: PreconditionValidator = {
      validate: async (context: ToolContext) => ({ isValid: true, message: "Valid 1" }),
    };
    const mockValidator2: PreconditionValidator = {
      validate: async (context: ToolContext) => ({ isValid: false, message: "Missing required argument" }),
    };
    const mockValidator3: PreconditionValidator = {
      validate: async (context: ToolContext) => ({ isValid: false, message: "Another error" }),
    };
    const chain = new ToolPreconditionValidatorChain([mockValidator1, mockValidator2, mockValidator3]);
    const context: ToolContext = { toolName: "test-tool" };

    const result = await chain.validateAll(context);
    expect(result.isValid).toBe(false);
    expect(result.message).toBe("Missing required argument");
  });

  it("should return success with an empty validator list", async () => {
    const chain = new ToolPreconditionValidatorChain([]);
    const context: ToolContext = { toolName: "test-tool" };

    const result = await chain.validateAll(context);
    expect(result.isValid).toBe(true);
    expect(result.message).toBe("All preconditions met.");
  });
});