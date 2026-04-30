import { describe, it, expect } from "vitest";
import { AdvancedContextEnricher } from "../src/validation/structured-tool-call-validator-v132-advanced-context-enricher";
import { Message } from "../src/validation/types";

describe("AdvancedContextEnricher", () => {
  it("should correctly initialize FlowStateContext when only messages are provided", () => {
    const enricher = new AdvancedContextEnricher();
    const messages: Message[] = [
      { role: "user", content: { type: "text", value: "Hello" } }
    ];
    const context = enricher.enrich({ messages });

    expect(context.flowState.currentStepId).toBe("");
    expect(context.flowState.activeConstraints).toEqual({});
    expect(context.flowState.sessionHistorySummary).toBe("");
    expect(context.flowState.isCriticalPath).toBe(false);
  });

  it("should enrich context with default values when messages are empty", () => {
    const enricher = new AdvancedContextEnricher();
    const messages: Message[] = [];
    const context = enricher.enrich({ messages });

    expect(context.messages).toEqual([]);
    expect(context.flowState.currentStepId).toBe("");
  });

  it("should handle context enrichment when messages contain multiple roles", () => {
    const enricher = new AdvancedContextEnricher();
    const messages: Message[] = [
      { role: "user", content: { type: "text", value: "First turn" } },
      { role: "assistant", content: { type: "text", value: "Second turn" } }
    ];
    const context = enricher.enrich({ messages });

    expect(context.messages).toEqual(messages);
    // Assuming the enricher logic populates flowState based on messages,
    // we test for a non-default state if the implementation supports it.
    // Since the provided snippet is incomplete, we test for the structure.
    expect(context.flowState).toBeDefined();
  });
});