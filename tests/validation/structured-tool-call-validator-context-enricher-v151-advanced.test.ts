import { describe, it, expect } from "vitest";
import {
  StructuredToolCallValidatorContextEnricherV151Advanced,
} from "../src/validation/structured-tool-call-validator-context-enricher-v151-advanced";

describe("StructuredToolCallValidatorContextEnricherV151Advanced", () => {
  it("should enrich context correctly with basic messages", async () => {
    const enricher = new StructuredToolCallValidatorContextEnricherV151Advanced();
    const messages = [
      { role: "user", content: "Hello" },
      { role: "assistant", content: [] },
    ];
    const enrichedContext = await enricher.enrichContext(messages);
    expect(enrichedContext).toBeDefined();
    expect(enrichedContext).toHaveLength(2);
  });

  it("should handle a mix of message types including tool results", async () => {
    const enricher = new StructuredToolCallValidatorContextEnricherV151Advanced();
    const messages = [
      { role: "user", content: "What is the weather?" },
      { role: "assistant", content: [] },
      { role: "tool", tool_use_id: "id1", content: "Sunny", is_error: false },
    ];
    const enrichedContext = await enricher.enrichContext(messages);
    expect(enrichedContext).toBeDefined();
    expect(enrichedContext).toHaveLength(3);
  });

  it("should return the original messages if no enrichment is needed or possible", async () => {
    const enricher = new StructuredToolCallValidatorContextEnricherV151Advanced();
    const messages = [
      { role: "user", content: "Simple query" },
    ];
    const enrichedContext = await enricher.enrichContext(messages);
    expect(enrichedContext).toEqual(messages);
  });
});