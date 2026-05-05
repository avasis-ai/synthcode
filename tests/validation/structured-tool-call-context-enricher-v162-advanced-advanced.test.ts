import { describe, it, expect } from "vitest";
import { StructuredToolCallContextEnricherV162AdvancedAdvanced } from "../src/validation/structured-tool-call-context-enricher-v162-advanced-advanced";

describe("StructuredToolCallContextEnricherV162AdvancedAdvanced", () => {
  it("should enrich context correctly with basic user and assistant messages", async () => {
    const enricher = new StructuredToolCallContextEnricherV162AdvancedAdvanced();
    const context = [
      { role: "user", content: "Hello world" },
      { role: "assistant", content: [{ type: "text", text: "Hi there!" }] }
    ];
    const enrichedContext = await enricher.enrichContext(context);
    expect(enrichedContext).toHaveLength(2);
    expect(enrichedContext[0].role).toBe("user");
    expect(enrichedContext[1].role).toBe("assistant");
  });

  it("should handle an empty context array gracefully", async () => {
    const enricher = new StructuredToolCallContextEnricherV162AdvancedAdvanced();
    const context: any[] = [];
    const enrichedContext = await enricher.enrichContext(context);
    expect(enrichedContext).toEqual([]);
  });

  it("should correctly process a context containing only tool result messages", async () => {
    const enricher = new StructuredToolCallContextEnricherV162AdvancedAdvanced();
    const context = [
      { role: "tool", content: "tool_result_1" },
      { role: "tool", content: "tool_result_2" }
    ];
    const enrichedContext = await enricher.enrichContext(context);
    expect(enrichedContext).toHaveLength(2);
    expect(enrichedContext[0].role).toBe("tool");
    expect(enrichedContext[1].role).toBe("tool");
  });
});