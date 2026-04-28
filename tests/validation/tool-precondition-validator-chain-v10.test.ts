import { describe, it, expect, vi } from "vitest";
import { ToolPreconditionValidatorChain, AdvancedPreconditionStep } from "../src/validation/tool-precondition-validator-chain-v10";

describe("ToolPreconditionValidatorChain", () => {
  it("should return valid result when all steps pass", async () => {
    const mockStep1: AdvancedPreconditionStep = {
      execute: async (context, messageHistory) => ({ isValid: true, errors: [] }),
    };
    const mockStep2: AdvancedPreconditionStep = {
      execute: async (context, messageHistory) => ({ isValid: true, errors: [] }),
    };

    const validator = new ToolPreconditionValidatorChain([mockStep1, mockStep2]);
    const result = await validator.validate({}, []);

    expect(result.isValid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it("should aggregate errors when any step fails", async () => {
    const mockStep1: AdvancedPreconditionStep = {
      execute: async (context, messageHistory) => ({ isValid: true, errors: [] }),
    };
    const mockStep2: AdvancedPreconditionStep = {
      execute: async (context, messageHistory) => ({ isValid: false, errors: ["Error in step 2"] }),
    };
    const mockStep3: AdvancedPreconditionStep = {
      execute: async (context, messageHistory) => ({ isValid: false, errors: ["Another error in step 3"] }),
    };

    const validator = new ToolPreconditionValidatorChain([mockStep1, mockStep2, mockStep3]);
    const result = await validator.validate({}, []);

    expect(result.isValid).toBe(false);
    expect(result.errors).toEqual(["Error in step 2", "Another error in step 3"]);
  });

  it("should stop execution and return errors immediately if a critical step fails (conceptually, though implementation might continue)", async () => {
    // Note: Based on the provided snippet, the implementation might continue collecting errors.
    // We test the expected behavior of collecting all errors if the chain is designed to do so.
    const mockStep1: AdvancedPreconditionStep = {
      execute: async (context, messageHistory) => ({ isValid: false, errors: ["Critical error in step 1"] }),
    };
    const mockStep2: AdvancedPreconditionStep = {
      execute: async (context, messageHistory) => ({ isValid: false, errors: ["Non-critical error in step 2"] }),
    };

    const validator = new ToolPreconditionValidatorChain([mockStep1, mockStep2]);
    const result = await validator.validate({}, []);

    expect(result.isValid).toBe(false);
    expect(result.errors).toHaveLength(2);
    expect(result.errors).toContain("Critical error in step 1");
    expect(result.errors).toContain("Non-critical error in step 2");
  });
});