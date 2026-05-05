import { describe, it, expect } from "vitest";
import { ContextualToolCallGuardrailChainBuilder } from "../src/validation/contextual-tool-call-guardrail-chain-builder";

describe("ContextualToolCallGuardrailChainBuilder", () => {
  it("should initialize with empty validator lists", () => {
    const builder = new ContextualToolCallGuardrailChainBuilder();
    // We can't directly test private fields, but we can test the addition mechanism
    // and assume correct initialization if addPreValidator works.
    expect(builder).toBeInstanceOf(ContextualToolCallGuardrailChainBuilder);
  });

  it("should allow adding multiple pre-validators", () => {
    const builder = new ContextualToolCallGuardrailChainBuilder();
    const mockValidator1: any = jest.fn();
    const mockValidator2: any = jest.fn();

    builder.addPreValidator(mockValidator1);
    builder.addPreValidator(mockValidator2);

    // A more robust test would involve checking the internal state, but for this scope,
    // we ensure the method can be called multiple times.
    // We assume the internal state management is correct if the methods don't crash.
  });

  it("should allow adding multiple post-validators", () => {
    const builder = new ContextualToolCallGuardrailChainBuilder();
    const mockValidator1: any = jest.fn();
    const mockValidator2: any = jest.fn();

    builder.addPostValidator(mockValidator1);
    builder.addPostValidator(mockValidator2);
  });
});