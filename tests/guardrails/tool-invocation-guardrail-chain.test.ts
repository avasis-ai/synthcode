import { describe, it, expect } from "vitest";
import { ToolInvocationGuardrailChain, IInvocationGuardrail, GuardrailResult } from "../src/guardrails/tool-invocation-guardrail-chain";
import { ToolInvocationContext } from "../src/guardrails/tool-invocation-context";

describe("ToolInvocationGuardrailChain", () => {
  it("should return success if all guardrails pass", async () => {
    const mockGuardrail1: IInvocationGuardrail = {
      validate: async (context: ToolInvocationContext): Promise<GuardrailResult> => ({ isValid: true }),
    };
    const mockGuardrail2: IInvocationGuardrail = {
      validate: async (context: ToolInvocationContext): Promise<GuardrailResult> => ({ isValid: true }),
    };
    const chain = new ToolInvocationGuardrailChain([mockGuardrail1, mockGuardrail2]);
    const context: ToolInvocationContext = { /* mock context */ };

    const result = await chain.run(context);
    expect(result.isValid).toBe(true);
    expect(result.message).toBeUndefined();
  });

  it("should return failure with the first failing guardrail's message", async () => {
    const mockGuardrail1: IInvocationGuardrail = {
      validate: async (context: ToolInvocationContext): Promise<GuardrailResult> => ({ isValid: false, message: "Guardrail 1 failed" }),
    };
    const mockGuardrail2: IInvocationGuardrail = {
      validate: async (context: ToolInvocationContext): Promise<GuardrailResult> => ({ isValid: true }),
    };
    const chain = new ToolInvocationGuardrailChain([mockGuardrail1, mockGuardrail2]);
    const context: ToolInvocationContext = { /* mock context */ };

    const result = await chain.run(context);
    expect(result.isValid).toBe(false);
    expect(result.message).toBe("Guardrail 1 failed");
  });

  it("should return failure if all guardrails fail", async () => {
    const mockGuardrail1: IInvocationGuardrail = {
      validate: async (context: ToolInvocationContext): Promise<GuardrailResult> => ({ isValid: false, message: "Guardrail 1 failed" }),
    };
    const mockGuardrail2: IInvocationGuardrail = {
      validate: async (context: ToolInvocationContext): Promise<GuardrailResult> => ({ isValid: false, message: "Guardrail 2 failed" }),
    };
    const chain = new ToolInvocationGuardrailChain([mockGuardrail1, mockGuardrail2]);
    const context: ToolInvocationContext = { /* mock context */ };

    const result = await chain.run(context);
    expect(result.isValid).toBe(false);
    // It should return the message of the first failing guardrail
    expect(result.message).toBe("Guardrail 1 failed");
  });
});