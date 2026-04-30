import { describe, it, expect } from "vitest";
import { StructuredToolCallValidatorContextEnricher } from "../src/validation/structured-tool-call-validator-context-enricher-v156-advanced";

describe("StructuredToolCallValidatorContextEnricher", () => {
  it("should enrich context with basic message structure", () => {
    const enricher = new StructuredToolCallValidatorContextEnricher();
    const context = {
      messages: [{ role: "user", content: [{ type: "text", text: "Hello" }] }],
      tool_call_context: { tool_name: "test_tool" },
      intended_context: {
        intended_path: "/user/profile",
        potential_side_effects: [],
      },
    };
    const enrichedContext = enricher.enrich(context);
    expect(enrichedContext.messages).toBeDefined();
    expect(enrichedContext.tool_call_context).toBeDefined();
    expect(enrichedContext.intended_context).toBeDefined();
  });

  it("should correctly process multiple messages including tool use", () => {
    const enricher = new StructuredToolCallValidatorContextEnricher();
    const context = {
      messages: [
        { role: "user", content: [{ type: "text", text: "What is the weather?" }] },
        { role: "assistant", content: [{ type: "tool_use", tool_call: { name: "weather_api", arguments: {} } }] },
      ],
      tool_call_context: { tool_name: "weather_api" },
      intended_context: {
        intended_path: "/weather",
        potential_side_effects: [{ action: "fetch_data", risk_level: "low", description: "Fetching weather" }],
      },
    };
    const enrichedContext = enricher.enrich(context);
    expect(enrichedContext.messages.length).toBe(2);
    expect(enrichedContext.tool_call_context.tool_name).toBe("weather_api");
  });

  it("should merge intended context side effects correctly", () => {
    const enricher = new StructuredToolCallValidatorContextEnricher();
    const context = {
      messages: [{ role: "user", content: [{ type: "text", text: "Check my settings." }] }],
      tool_call_context: {},
      intended_context: {
        intended_path: "/settings",
        potential_side_effects: [
          { action: "read_data", risk_level: "low", description: "Reading settings" },
          { action: "write_data", risk_level: "medium", description: "Updating settings" },
        ],
      },
    };
    const enrichedContext = enricher.enrich(context);
    expect(enrichedContext.intended_context.potential_side_effects.length).toBe(2);
    expect(enrichedContext.intended_context.potential_side_effects[1].action).toBe("write_data");
  });
});