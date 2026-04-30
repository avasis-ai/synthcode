import { describe, it, expect } from "vitest";
import { StructuredToolCallValidatorContextEnricher } from "../src/validation/structured-tool-call-validator-context-enricher-v167";

describe("StructuredToolCallValidatorContextEnricher", () => {
  it("should enrich context when a tool call is intended and context is complete", () => {
    const enricher = new StructuredToolCallValidatorContextEnricher();
    const context: ValidationContext = {
      messages: [{ role: "user", content: "What is the weather?" }],
      tool_call_context: {
        sequence_id: "seq1",
        intended_next_action: "tool_call",
        reasoning_context: "User asked for weather.",
      },
      metadata: { source: "user_input" },
    };

    const enrichedContext = enricher.enrich(context, "tool_call");

    expect(enrichedContext).toBeDefined();
    expect(enrichedContext?.tool_call_context?.intended_next_action).toBe("tool_call");
    expect(enrichedContext?.tool_call_context?.reasoning_context).toContain("weather");
  });

  it("should handle context enrichment when no tool call is intended", () => {
    const enricher = new StructuredToolCallValidatorContextEnricher();
    const context: ValidationContext = {
      messages: [{ role: "assistant", content: "Here is the answer." }],
      tool_call_context: {
        sequence_id: "seq2",
        intended_next_action: "text_response",
        reasoning_context: "Providing final answer.",
      },
      metadata: { source: "system" },
    };

    const enrichedContext = enricher.enrich(context, "text_response");

    expect(enrichedContext).toBeDefined();
    expect(enrichedContext?.tool_call_context?.intended_next_action).toBe("text_response");
  });

  it("should maintain context integrity when context is missing parts", () => {
    const enricher = new StructuredToolCallValidatorContextEnricher();
    const context: ValidationContext = {
      messages: [{ role: "user", content: "Test" }],
      tool_call_context: {
        sequence_id: "seq3",
        intended_next_action: "wait",
        reasoning_context: "Waiting for external input.",
      },
      metadata: {},
    };

    const enrichedContext = enricher.enrich(context, "wait");

    expect(enrichedContext).toBeDefined();
    expect(enrichedContext?.tool_call_context?.intended_next_action).toBe("wait");
    expect(enrichedContext?.tool_call_context?.sequence_id).toBe("seq3");
  });
});