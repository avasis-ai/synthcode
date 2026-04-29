import { describe, it, expect } from "vitest";
import { ToolPreconditionChainValidatorAdvanced } from "../src/validation/tool-precondition-chain-validator-advanced";

describe("ToolPreconditionChainValidatorAdvanced", () => {
  it("should validate a simple successful precondition chain", async () => {
    const validator = new ToolPreconditionChainValidatorAdvanced();
    const mockSteps: { name: string; execute: (context: Record<string, any>, messages: Message[], toolInputs: Record<string, unknown>) => Promise<{ isValid: boolean; error?: string; contextUpdate?: Record<string, any>; }> }[] = [
      {
        name: "step1",
        execute: async (context, messages, toolInputs) => ({
          isValid: true,
          contextUpdate: { step1_result: "success" },
        }),
      },
      {
        name: "step2",
        execute: async (context, messages, toolInputs) => ({
          isValid: true,
          contextUpdate: { step2_result: "success" },
        }),
      },
    ];

    const result = await validator.validate(mockSteps, {}, [], {});

    expect(result.isValid).toBe(true);
    expect(result.errors).toEqual([]);
    expect(result.context).toEqual({ step1_result: "success", step2_result: "success" });
  });

  it("should fail validation if any precondition step returns invalid", async () => {
    const validator = new ToolPreconditionChainValidatorAdvanced();
    const mockSteps: { name: string; execute: (context: Record<string, any>, messages: Message[], toolInputs: Record<string, unknown>) => Promise<{ isValid: boolean; error?: string; contextUpdate?: Record<string, any>; }> }[] = [
      {
        name: "step1",
        execute: async (context, messages, toolInputs) => ({
          isValid: true,
          contextUpdate: { step1_result: "ok" },
        }),
      },
      {
        name: "step2_fail",
        execute: async (context, messages, toolInputs) => ({
          isValid: false,
          error: "Step 2 failed due to missing input.",
        }),
      },
      {
        name: "step3",
        execute: async (context, messages, toolInputs) => ({
          isValid: true,
          contextUpdate: { step3_result: "should_not_run" },
        }),
      },
    ];

    const result = await validator.validate(mockSteps, {}, [], {});

    expect(result.isValid).toBe(false);
    expect(result.errors).toContain("Step 2 failed due to missing input.");
    // Check that context only contains updates from successful steps before the failure
    expect(result.context).toEqual({ step1_result: "ok" });
  });

  it("should handle an empty precondition chain gracefully", async () => {
    const validator = new ToolPreconditionChainValidatorAdvanced();
    const mockSteps: { name: string; execute: (context: Record<string, any>, messages: Message[], toolInputs: Record<string, unknown>) => Promise<{ isValid: boolean; error?: string; contextUpdate?: Record<string, any>; }> }[] = [];

    const result = await validator.validate(mockSteps, {}, [], {});

    expect(result.isValid).toBe(true);
    expect(result.errors).toEqual([]);
    expect(result.context).toEqual({});
  });
});