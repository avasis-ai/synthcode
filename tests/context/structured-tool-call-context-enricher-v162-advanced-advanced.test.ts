import { describe, it, expect } from "vitest";
import { StructuredToolCallContextEnricherV162AdvancedAdvanced } from "../src/context/structured-tool-call-context-enricher-v162-advanced-advanced";

describe("StructuredToolCallContextEnricherV162AdvancedAdvanced", () => {
  it("should enrich context with basic information when history is present", () => {
    const mockContext: any = {
      tool_name: "search_tool",
      parameters: { query: "test search" },
      history: [
        { role: "user", content: [{ type: "text", text: "What is the weather?" }] },
        { role: "assistant", content: [{ type: "tool_use", tool_use: { tool_name: "weather_api", parameters: { location: "London" } } }] },
      ],
      state: {
        history: [],
        current_state: { user_id: "123" },
        available_tools: { weather_api: {} },
      },
    };

    const enricher = new StructuredToolCallContextEnricherV162AdvancedAdvanced();
    const enriched = enricher.enrich(mockContext);

    expect(enriched).toHaveProperty("user_id", "123");
    expect(enriched).toHaveProperty("last_user_query", "What is the weather?");
    expect(enriched).toHaveProperty("last_tool_name", "weather_api");
  });

  it("should handle empty history gracefully", () => {
    const mockContext: any = {
      tool_name: "calculator",
      parameters: { expression: "2+2" },
      history: [],
      state: {
        history: [],
        current_state: {},
        available_tools: {},
      },
    };

    const enricher = new StructuredToolCallContextEnricherV162AdvancedAdvanced();
    const enriched = enricher.enrich(mockContext);

    expect(enriched).not.toHaveProperty("last_user_query");
    expect(enriched).not.toHaveProperty("last_tool_name");
    expect(enriched).toHaveProperty("user_id");
  });

  it("should correctly extract parameters from the last user message", () => {
    const mockContext: any = {
      tool_name: "user_input_processor",
      parameters: { input: "user data" },
      history: [
        { role: "user", content: [{ type: "text", text: "Process this data: user data" }] },
      ],
      state: {
        history: [],
        current_state: {},
        available_tools: {},
      },
    };

    const enricher = new StructuredToolCallContextEnricherV162AdvancedAdvanced();
    const enriched = enricher.enrich(mockContext);

    expect(enriched).toHaveProperty("last_user_query", "Process this data: user data");
  });
});