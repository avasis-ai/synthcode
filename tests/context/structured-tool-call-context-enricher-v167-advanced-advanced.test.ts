import { describe, it, expect } from "vitest";
import { StructuredToolCallContextEnricher } from "../src/context/structured-tool-call-context-enricher-v167-advanced-advanced";

describe("StructuredToolCallContextEnricher", () => {
  it("should enrich context with basic information when provided with messages", async () => {
    const enricher = new StructuredToolCallContextEnricher();
    const messages = [
      { role: "user", content: "Hello world" },
      { role: "assistant", content: "Hi there!" },
    ];
    const enrichedContext = await enricher.enrichContext(messages);

    expect(enrichedContext.historySummary).toBe("User said: Hello world. Assistant said: Hi there!");
    expect(enrichedContext.knowledgeGraphTriples).toHaveLength(0);
    expect(enrichedContext.toolCallContext).toEqual({});
  });

  it("should correctly extract and summarize tool calls and results", async () => {
    const enricher = new StructuredToolCallContextEnricher();
    const messages = [
      { role: "user", content: "What is the capital of France?" },
      { role: "assistant", content: "Call tool: get_capital(country='France')" },
      { role: "tool_result", content: "Paris" },
    ];
    const enrichedContext = await enricher.enrichContext(messages);

    expect(enrichedContext.historySummary).toContain("User said: What is the capital of France?");
    expect(enrichedContext.toolCallContext).toHaveProperty("get_capital", { lastResult: "Paris" });
  });

  it("should handle an empty message history gracefully", async () => {
    const enricher = new StructuredToolCallContextEnricher();
    const messages: any[] = [];
    const enrichedContext = await enricher.enrichContext(messages);

    expect(enrichedContext.historySummary).toBe("");
    expect(enrichedContext.knowledgeGraphTriples).toHaveLength(0);
    expect(enrichedContext.toolCallContext).toEqual({});
  });
});