import { describe, it, expect } from "vitest";
import { ToolPreconditionValidatorChainV2 } from "../src/validation/tool-precondition-validator-chain-v2";

describe("ToolPreconditionValidatorChainV2", () => {
  it("should correctly validate with only sync validators", async () => {
    const mockValidators: {
      async: any[];
      sync: any[];
    } = {
      async: [],
      sync: [
        (context: any) => ({ isValid: true, errors: [] }),
      ],
    };
    const validatorChain = new ToolPreconditionValidatorChainV2(mockValidators);
    const result = await validatorChain.validate(
      { messages: [], toolUse: {} }
    );
    expect(result.isValid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it("should correctly validate with only async validators", async () => {
    const mockValidators: {
      async: any[];
      sync: any[];
    } = {
      async: [
        async (context: any) => ({ isValid: true, errors: [] }),
      ],
      sync: [],
    };
    const validatorChain = new ToolPreconditionValidatorChainV2(mockValidators);
    const result = await validatorChain.validate(
      { messages: [], toolUse: {} }
    );
    expect(result.isValid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it("should aggregate errors from both sync and async validators", async () => {
    const mockValidators: {
      async: any[];
      sync: any[];
    } = {
      async: [
        async (context: any) => ({ isValid: false, errors: ["Async error"] }),
      ],
      sync: [
        (context: any) => ({ isValid: false, errors: ["Sync error"] }),
      ],
    };
    const validatorChain = new ToolPreconditionValidatorChainV2(mockValidators);
    const result = await validatorChain.validate(
      { messages: [], toolUse: {} }
    );
    expect(result.isValid).toBe(false);
    expect(result.errors).toEqual(["Async error", "Sync error"]);
  });
});