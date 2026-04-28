import { describe, it, expect } from "vitest";
import { ToolPreconditionValidatorChainV8 } from "../src/validation/tool-precondition-validator-chain-v8";

describe("ToolPreconditionValidatorChainV8", () => {
  it("should pass when all steps succeed", async () => {
    const mockValidator = new ToolPreconditionValidatorChainV8([
      async (context) => {
        context.state["step1"] = true;
        return { success: true };
      },
      async (context) => {
        context.state["step2"] = "ok";
        return { success: true };
      },
    ]);

    const result = await mockValidator.validate({
      messages: [],
      state: {},
    });

    expect(result.success).toBe(true);
    expect(result.errors).toHaveLength(0);
    expect(result.finalContextUpdate).toEqual({
      step1: true,
      step2: "ok",
    });
  });

  it("should fail and stop on the first failing step", async () => {
    const mockValidator = new ToolPreconditionValidatorChainV8([
      async (context) => {
        context.state["step1"] = true;
        return { success: true };
      },
      async (context) => {
        return { success: false, error: "Step 2 failed validation" };
      },
      async (context) => {
        // This step should not be reached
        return { success: true };
      },
    ]);

    const result = await mockValidator.validate({
      messages: [],
      state: {},
    });

    expect(result.success).toBe(false);
    expect(result.errors).toContain("Step 2 failed validation");
    expect(result.finalContextUpdate).toEqual({
      step1: true,
    });
  });

  it("should return success if there are no steps", async () => {
    const mockValidator = new ToolPreconditionValidatorChainV8([]);

    const result = await mockValidator.validate({
      messages: [],
      state: { initial: "state" },
    });

    expect(result.success).toBe(true);
    expect(result.errors).toHaveLength(0);
    expect(result.finalContextUpdate).toEqual({ initial: "state" });
  });
});