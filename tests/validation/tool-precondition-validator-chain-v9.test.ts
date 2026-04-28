import { describe, it, expect } from "vitest";
import { ToolPreconditionValidatorChainV9 } from "../src/validation/tool-precondition-validator-chain-v9";

const mockValidator1 = {
  validate: (context: any) => ({ isValid: true, message: "Valid 1" }),
};
const mockValidator2 = {
  validate: (context: any) => ({ isValid: false, message: "Invalid 2" }),
};

describe("ToolPreconditionValidatorChainV9", () => {
  it("should return success if all validators pass", () => {
    const validatorChain = new ToolPreconditionValidatorChainV9([mockValidator1]);
    const result = validatorChain.validate({} as any);
    expect(result.isValid).toBe(true);
  });

  it("should return failure immediately if any validator fails", () => {
    const validatorChain = new ToolPreconditionValidatorChainV9([mockValidator1, mockValidator2]);
    const result = validatorChain.validate({} as any);
    expect(result.isValid).toBe(false);
    expect(result.message).toContain("Invalid 2");
  });

  it("should correctly chain validators when added programmatically", () => {
    const validatorChain = new ToolPreconditionValidatorChainV9();
    const chain = validatorChain.addValidator(mockValidator1).addValidator(mockValidator2);
    const result = chain.validate({} as any);
    expect(result.isValid).toBe(false);
  });
});