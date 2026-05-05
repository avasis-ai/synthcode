import { describe, it, expect } from "vitest";
import { StructuredToolCallValidatorContextEnricherV164AdvancedAdvanced } from "../src/validation/structured-tool-call-validator-context-enricher-v164-advanced-advanced";

describe("StructuredToolCallValidatorContextEnricherV164AdvancedAdvanced", () => {
  it("should correctly enrich context with basic state and history", () => {
    const enricher = new StructuredToolCallValidatorContextEnricherV164AdvancedAdvanced();
    const contextState: Record<string, any> = { userId: "user123", session: "abc" };
    const history: Message[] = [
      { type: "user", content: [{ type: "text", text: "Hello" }] }
    ];
    const globalConstraints: Record<string, any> = { maxTokens: 200 };
    const explicitContext: Record<string, unknown> = { source: "web" };

    const enrichedContext = enricher.enrichContext(
      contextState,
      history,
      globalConstraints,
      explicitContext
    );

    expect(enrichedContext.currentState).toEqual(contextState);
    expect(enrichedContext.history).toEqual(history);
    expect(enrichedContext.globalConstraints).toEqual(globalConstraints);
    expect(enrichedContext.explicitContext).toEqual(explicitContext);
  });

  it("should handle empty history and context", () => {
    const enricher = new StructuredToolCallValidatorContextEnricherV164AdvancedAdvanced();
    const contextState: Record<string, any> = {};
    const history: Message[] = [];
    const globalConstraints: Record<string, any> = {};
    const explicitContext: Record<string, unknown> = {};

    const enrichedContext = enricher.enrichContext(
      contextState,
      history,
      globalConstraints,
      explicitContext
    );

    expect(enrichedContext.currentState).toEqual({});
    expect(enrichedContext.history).toEqual([]);
    expect(enrichedContext.globalConstraints).toEqual({});
    expect(enrichedContext.explicitContext).toEqual({});
  });

  it("should correctly merge and validate context types", () => {
    const enricher = new StructuredToolCallValidatorContextEnricherV164AdvancedAdvanced();
    const contextState: Record<string, any> = { user: { id: 1 } };
    const history: Message[] = [
      { type: "assistant", content: [{ type: "text", text: "Tool used." }] }
    ];
    const globalConstraints: Record<string, any> = { model: "gpt-4" };
    const explicitContext: Record<string, unknown> = { sessionId: "xyz" };

    const enrichedContext = enricher.enrichContext(
      contextState,
      history,
      globalConstraints,
      explicitContext
    );

    expect(enrichedContext.currentState).toEqual(contextState);
    expect(enrichedContext.history).toHaveLength(1);
    expect(enrichedContext.globalConstraints).toEqual(globalConstraints);
    expect(enrichedContext.explicitContext).toEqual(explicitContext);
  });
});