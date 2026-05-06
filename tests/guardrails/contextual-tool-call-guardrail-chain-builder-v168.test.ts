import { describe, it, expect } from "vitest";
import { buildContextualToolCallGuardrailChainBuilder } from "../src/guardrails/contextual-tool-call-guardrail-chain-builder-v168";

describe("buildContextualToolCallGuardrailChainBuilder", () => {
  it("should correctly build the guardrail chain builder with basic context", () => {
    const builder = buildContextualToolCallGuardrailChainBuilder();
    expect(typeof builder).toBe("object");
    expect(typeof builder.build).toBe("function");
  });

  it("should handle context with history and contextData", () => {
    const context: Context = {
      history: [
        { type: "user", content: "What is the capital of France?" } as Message,
        { type: "assistant", content: "The capital of France is Paris." } as Message,
      ],
      contextData: { user: "testuser", location: "France" },
      resourceConstraints: { max_tokens: 100 },
    };
    const builder = buildContextualToolCallGuardrailChainBuilder(context);
    // We can't test the internal logic fully without knowing the exact output,
    // but we can check if the builder accepts the context.
    expect(builder).toBeDefined();
  });

  it("should return a valid guardrail validator when provided with necessary inputs", () => {
    const context: Context = {
      history: [],
      contextData: {},
      resourceConstraints: {},
    };
    const builder = buildContextualToolCallGuardrailChainBuilder(context);
    const validator = builder.getValidator();
    expect(typeof validator).toBe("function");
  });
});