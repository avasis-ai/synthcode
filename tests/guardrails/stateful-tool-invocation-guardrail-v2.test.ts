import { describe, it, expect } from "vitest";
import { StatefulToolInvocationGuardrailV2 } from "../src/guardrails/stateful-tool-invocation-guardrail-v2";

describe("StatefulToolInvocationGuardrailV2", () => {
  it("should pass when the required tool has been called at least once", async () => {
    const guardrail = new StatefulToolInvocationGuardrailV2();
    const history: { toolName: string; invocationCount: number; lastCalledStep: number; success: boolean }[] = [
      { toolName: "ToolA", invocationCount: 1, lastCalledStep: 1, success: true },
    ];
    const result = await guardrail.check(history, "ToolB");
    expect(result).toBe(true);
  });

  it("should fail when the required tool has not been called", async () => {
    const guardrail = new StatefulToolInvocationGuardrailV2();
    const history: { toolName: string; invocationCount: number; lastCalledStep: number; success: boolean }[] = [
      { toolName: "ToolC", invocationCount: 1, lastCalledStep: 1, success: true },
    ];
    const result = await guardrail.check(history, "ToolB");
    expect(result).toBe(false);
  });

  it("should pass even if the required tool was called but failed previously", async () => {
    const guardrail = new StatefulToolInvocationGuardrailV2();
    const history: { toolName: string; invocationCount: number; lastCalledStep: number; success: boolean }[] = [
      { toolName: "ToolA", invocationCount: 1, lastCalledStep: 1, success: false },
    ];
    // Assuming the guardrail logic allows subsequent calls even if the last one failed,
    // as long as the tool was called at least once.
    const result = await guardrail.check(history, "ToolB");
    expect(result).toBe(true);
  });
});