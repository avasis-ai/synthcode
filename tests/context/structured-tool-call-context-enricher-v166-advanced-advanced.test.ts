import { describe, it, expect } from "vitest";
import { StructuredToolCallContextEnricher } from "../src/context/structured-tool-call-context-enricher-v166-advanced-advanced";
import { Message, UserMessage, AssistantMessage, ToolResultMessage, ContentBlock, TextBlock, ToolUseBlock, ThinkingBlock } from "../src/context/types";

describe("StructuredToolCallContextEnricher", () => {
  it("should correctly enrich context with basic messages and tool results", () => {
    const sources: ContextSource[] = [
      { name: "user_input", context: [new UserMessage("Hello world")], weight: 1.0 },
      { name: "tool_result", context: [new ToolResultMessage("Tool executed successfully")], weight: 0.8 },
    ];
    const enricher = new StructuredToolCallContextEnricher(sources);
    const enriched = enricher.enrichContext();

    expect(enriched.final_state).toHaveProperty("user_input");
    expect(enriched.final_state).toHaveProperty("tool_result");
    expect(enriched.resolved_tool_inputs).toEqual({});
    expect(enriched.priority_summary).toContain("user_input");
  });

  it("should handle multiple tool use and thinking blocks", () => {
    const sources: ContextSource[] = [
      { name: "history", context: [
        new UserMessage("What is the weather?"),
        new AssistantMessage(
          [
            new ThinkingBlock("Thinking about weather API call..."),
            new ToolUseBlock("weather_api", { location: "New York" }),
          ],
        ),
        new ToolResultMessage("The weather is sunny."),
      ], weight: 1.0 },
    ];
    const enricher = new StructuredToolCallContextEnricher(sources);
    const enriched = enricher.enrichContext();

    expect(enriched.final_state).toHaveProperty("history");
    expect(enriched.resolved_tool_inputs).toEqual({ weather_api: { location: "New York" } });
    expect(enriched.priority_summary).toContain("history");
  });

  it("should prioritize context from sources with higher weights", () => {
    const sources: ContextSource[] = [
      { name: "low_priority", context: [new UserMessage("Low weight query")], weight: 0.3 },
      { name: "high_priority", context: [new UserMessage("High weight query")], weight: 0.9 },
    ];
    const enricher = new StructuredToolCallContextEnricher(sources);
    const enriched = enricher.enrichContext();

    expect(enriched.priority_summary).toContain("high_priority");
    expect(enriched.priority_summary).not.toContain("low_priority");
  });
});