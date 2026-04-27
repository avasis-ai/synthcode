import { describe, it, expect } from "vitest";
import { ToolExecutionGuardrailChain } from "../src/guardrails/tool-execution-guardrail-chain";
import { Guardrail } from "../src/guardrails/guardrail";

describe("ToolExecutionGuardrailChain", () => {
  it("should pass validation if all guardrails pass", async () => {
    const mockGuardrail1: Guardrail = {
      validate: async (context: any, step: any) => ({ isValid: true, message: "OK" }),
    };
    const mockGuardrail2: Guardrail = {
      validate: async (context: any, step: any) => ({ isValid: true, message: "OK" }),
    };

    const chain = new ToolExecutionGuardrailChain([mockGuardrail1, mockGuardrail2]);
    const context = { history: [], tool_call_id: "id123" };
    const step = { type: "tool_call", tool_name: "test_tool", input: { data: "test" } };

    await expect(chain.validate(context, step)).resolves.not.toThrow();
  });

  it("should throw an error if any guardrail fails validation", async () => {
    const mockGuardrail1: Guardrail = {
      validate: async (context: any, step: any) => ({ isValid: true, message: "OK" }),
    };
    const mockGuardrail2: Guardrail = {
      validate: async (context: any, step: any) => ({ isValid: false, message: "Validation failed" }),
    };

    const chain = new ToolExecutionGuardrailChain([mockGuardrail1, mockGuardrail2]);
    const context = { history: [], tool_call_id: "id123" };
    const step = { type: "tool_call", tool_name: "test_tool", input: { data: "test" } };

    await expect(chain.validate(context, step)).rejects.toThrow("Validation failed");
  });

  it("should handle an empty list of guardrails gracefully", async () => {
    const chain = new ToolExecutionGuardrailChain([]);
    const context = { history: [], tool_call_id: "id123" };
    const step = { type: "tool_call", tool_name: "test_tool", input: { data: "test" } };

    await expect(chain.validate(context, step)).resolves.not.toThrow();
  });
});