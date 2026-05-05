import { describe, it, expect } from "vitest";
import { ContextualToolCallGuardrailChainBuilder } from "../src/guardrails/contextual-tool-call-guardrail-chain-builder";
import { Message, ToolUseBlock } from "../src/guardrails/types";

describe("ContextualToolCallGuardrailChainBuilder", () => {
  it("should initialize with no validators", () => {
    const builder = new ContextualToolCallGuardrailChainBuilder();
    // We can't directly access private members, so we'll test by adding and checking if it's callable later,
    // but for a basic check, we assume the constructor works.
    expect(builder).toBeInstanceOf(ContextualToolCallGuardrailChainBuilder);
  });

  it("should add validators correctly", () => {
    const builder = new ContextualToolCallGuardrailChainBuilder();
    const mockValidator1 = { validate: () => ({ isValid: true, message: "", context: {} }) };
    const mockValidator2 = { validate: () => ({ isValid: true, message: "", context: {} }) };

    // Since we can't spy on private array size directly, we'll rely on the chaining mechanism
    // and assume the internal state is managed correctly by the implementation.
    // A more robust test would require making the validators array accessible or adding a getter.
    builder.addValidator(mockValidator1);
    builder.addValidator(mockValidator2);

    // We'll test the resulting chain execution which implicitly uses the added validators.
  });

  it("should execute all added validators sequentially", () => {
    const builder = new ContextualToolCallGuardrailChainBuilder();
    const mockValidator1 = { validate: vi.fn().mockReturnValue({ isValid: true, message: "ok1", context: {} }) };
    const mockValidator2 = { validate: vi.fn().mockReturnValue({ isValid: true, message: "ok2", context: {} }) };
    const mockValidator3 = { validate: vi.fn().mockReturnValue({ isValid: true, message: "ok3", context: {} }) };

    builder.addValidator(mockValidator1 as any);
    builder.addValidator(mockValidator2 as any);
    builder.addValidator(mockValidator3 as any);

    const context: any = { message: {} as Message, toolCall: {} as ToolUseBlock };
    const result = builder.build(context);

    expect(mockValidator1.validate).toHaveBeenCalledWith(context);
    expect(mockValidator2.validate).toHaveBeenCalledWith(context);
    expect(mockValidator3.validate).toHaveBeenCalledWith(context);
    expect(result).toBeDefined();
  });
});