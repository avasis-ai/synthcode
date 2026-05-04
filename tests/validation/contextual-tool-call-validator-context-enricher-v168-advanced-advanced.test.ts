import { describe, it, expect } from "vitest";
import { ContextualToolCallValidatorContextEnricherV168AdvancedAdvanced } from "../src/validation/contextual-tool-call-validator-context-enricher-v168-advanced-advanced";

describe("ContextualToolCallValidatorContextEnricherV168AdvancedAdvanced", () => {
  it("should enrich context correctly when previous messages are present", async () => {
    const enricher = new ContextualToolCallValidatorContextEnricherV168AdvancedAdvanced();
    const previousMessages = [
      { role: "user", content: "What is the capital of France?" },
      { role: "assistant", content: [] }, // Simplified for test
      { role: "tool", tool_use_id: "tool_1", content: "Paris", is_error: false },
    ];
    const enrichedContext = await enricher.enrichContext(previousMessages);
    expect(enrichedContext).toHaveLength(3);
    expect(enrichedContext[2].role).toBe("tool");
  });

  it("should handle an empty message history gracefully", async () => {
    const enricher = new ContextualToolCallValidatorContextEnricherV168AdvancedAdvanced();
    const previousMessages: any[] = [];
    const enrichedContext = await enricher.enrichContext(previousMessages);
    expect(enrichedContext).toEqual([]);
  });

  it("should correctly process a mix of user and assistant messages", async () => {
    const enricher = new ContextualToolCallValidatorContextEnricherV168AdvancedAdvanced();
    const previousMessages = [
      { role: "user", content: "Hello" },
      { role: "assistant", content: [] },
      { role: "user", content: "How are you?" },
    ];
    const enrichedContext = await enricher.enrichContext(previousMessages);
    expect(enrichedContext).toHaveLength(3);
    expect(enrichedContext[0].role).toBe("user");
    expect(enrichedContext[2].role).toBe("user");
  });
});