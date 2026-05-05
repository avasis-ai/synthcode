import { describe, it, expect } from "vitest";
import { ContextualToolCallGuardrailChainBuilderAdvanced } from "../src/guardrails/contextual-tool-call-guardrail-chain-builder-advanced";

describe("ContextualToolCallGuardrailChainBuilderAdvanced", () => {
  it("should successfully build a guardrail chain builder", async () => {
    const builder = new ContextualToolCallGuardrailChainBuilderAdvanced();
    const context: GuardrailContext = {
      messages: [{ role: "user", content: "Test message" }],
      toolCalls: [],
      context: { initial: true },
    };
    const result = await builder.build(context);
    expect(result.success).toBe(true);
    expect(result.output).not.toBeNull();
    expect(result.errors).toEqual([]);
    expect(result.contextUpdates).toEqual({ initial: true });
  });

  it("should handle context updates correctly when tool calls are present", async () => {
    const builder = new ContextualToolCallGuardrailChainBuilderAdvanced();
    const context: GuardrailContext = {
      messages: [{ role: "user", content: "Call tool A and B" }],
      toolCalls: [{ toolName: "A" }, { toolName: "B" }],
      context: { user_id: "123" },
    };
    const result = await builder.build(context);
    expect(result.success).toBe(true);
    expect(result.contextUpdates).toHaveProperty("tool_calls_processed");
    expect(result.contextUpdates["tool_calls_processed"]).toBe(2);
  });

  it("should return failure if critical context information is missing", async () => {
    const builder = new ContextualToolCallGuardrailChainBuilderAdvanced();
    const context: GuardrailContext = {
      messages: [],
      toolCalls: [],
      context: {},
    };
    const result = await builder.build(context);
    expect(result.success).toBe(false);
    expect(result.errors).toContain("Message history is empty, cannot determine context.");
  });
});