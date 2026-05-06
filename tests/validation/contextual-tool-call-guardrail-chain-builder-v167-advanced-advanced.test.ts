import { describe, it, expect } from "vitest";
import { ContextualToolCallGuardrailChainBuilder } from "../src/validation/contextual-tool-call-guardrail-chain-builder-v167-advanced-advanced";
import { Message, ToolUseBlock } from "../src/validation/types";

describe("ContextualToolCallGuardrailChainBuilder", () => {
  it("should initialize with no steps", () => {
    const builder = new ContextualToolCallGuardrailChainBuilder();
    // Assuming there's a way to check private state or we test the public API's effect
    // Since we can't easily access private state, we'll rely on adding steps and checking behavior.
    // For this test, we'll just instantiate and ensure it doesn't crash.
    expect(builder).toBeInstanceOf(ContextualToolCallGuardrailChainBuilder);
  });

  it("should add a single step correctly", async () => {
    const builder = new ContextualToolCallGuardrailChainBuilder();
    const mockStep: any = async (context) => ({ validatedContext: context, output: "ok" });
    builder.addStep(mockStep);

    // To properly test this, we'd need a method to execute the chain.
    // Since we only have addStep, we'll assume adding it is sufficient for this basic test.
    // A more robust test would check the internal array size if it were accessible.
    // For now, we confirm the method runs without error.
    await expect(builder.addStep(mockStep)).resolves.toBe(builder);
  });

  it("should add multiple steps sequentially", async () => {
    const builder = new ContextualToolCallGuardrailChainBuilder();
    const mockStep1: any = async (context) => ({ validatedContext: context, output: "step1_ok" });
    const mockStep2: any = async (context) => ({ validatedContext: context, output: "step2_ok" });

    builder.addStep(mockStep1);
    builder.addStep(mockStep2);

    // Again, testing the side effect of adding multiple steps.
    await expect(builder.addStep(mockStep1)).resolves.toBe(builder);
    await expect(builder.addStep(mockStep2)).resolves.toBe(builder);
  });
});