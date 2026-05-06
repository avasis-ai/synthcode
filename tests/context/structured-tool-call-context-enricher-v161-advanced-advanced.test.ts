import { describe, it, expect } from "vitest";
import { enrichContext } from "../src/context/structured-tool-call-context-enricher-v161-advanced-advanced";
import { Message, UserMessage, AssistantMessage, ToolResultMessage, ContentBlock, TextBlock, ToolUseBlock, ThinkingBlock } from "../src/context/types";

describe("enrichContext", () => {
  it("should correctly enrich context with multiple sources and resolve conflicts", async () => {
    const contextSources: any[] = [
      { name: "sourceA", data: { user_id: "user123", theme: "dark" }, priority: 10 },
      { name: "sourceB", data: { user_id: "user456", theme: "light", location: "NYC" }, priority: 5 },
      { name: "sourceC", data: { theme: "system" }, priority: 15 },
    ];
    const initialContext: any = {
      messages: [
        new UserMessage("Hello"),
        new AssistantMessage("Hi there!")
      ],
      tool_calls: [
        new ToolUseBlock("tool1", "input1")
      ]
    };

    const enriched = await enrichContext(initialContext, contextSources);

    expect(enriched.source_data).toHaveProperty("user_id");
    expect(enriched.source_data.user_id.value).toBe("user123"); // Should take highest priority (sourceA)
    expect(enriched.source_data.theme.value).toBe("system"); // Should take highest priority (sourceC)
    expect(enriched.source_data.location.value).toBe("NYC"); // Should take value from sourceB
    expect(enriched.resolved_context).toEqual({
      user_id: "user123",
      theme: "system",
      location: "NYC",
    });
    expect(enriched.conflict_resolution_metadata.resolved_fields).toEqual(["user_id", "theme", "location"]);
  });

  it("should handle empty context sources gracefully", async () => {
    const contextSources: any[] = [];
    const initialContext: any = {
      messages: [new UserMessage("Test")],
      tool_calls: []
    };

    const enriched = await enrichContext(initialContext, contextSources);

    expect(enriched.source_data).toEqual({});
    expect(enriched.resolved_context).toEqual({});
    expect(enriched.conflict_resolution_metadata.resolved_fields).toEqual([]);
  });

  it("should prioritize context from higher priority sources", async () => {
    const contextSources: any[] = [
      { name: "low_priority", data: { setting: "value_low" }, priority: 1 },
      { name: "high_priority", data: { setting: "value_high" }, priority: 100 },
    ];
    const initialContext: any = {
      messages: [],
      tool_calls: []
    };

    const enriched = await enrichContext(initialContext, contextSources);

    expect(enriched.source_data.setting.value).toBe("value_high");
    expect(enriched.resolved_context.setting).toBe("value_high");
  });
});