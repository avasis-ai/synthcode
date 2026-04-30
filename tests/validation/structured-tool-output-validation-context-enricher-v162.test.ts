import { describe, it, expect } from "vitest";
import {
  StructuredToolOutputValidationContextEnricherV162,
  ExecutionHistory,
  EnrichedValidationContext,
} from "../src/validation/structured-tool-output-validation-context-enricher-v162";

describe("StructuredToolOutputValidationContextEnricherV162", () => {
  it("should correctly enrich context with basic history when no tool use occurred", async () => {
    const enricher = new StructuredToolOutputValidationContextEnricherV162();
    const history: ExecutionHistory = {
      messages: [{ role: "user", content: "Hello" }],
      tool_results: {},
    };
    const originalContext: any = { user_id: "user123" };

    const enrichedContext = await enricher.enrich(
      originalContext,
      history
    );

    expect(enrichedContext.historyMetadata.lastToolCallId).toBeNull();
    expect(enrichedContext.historyMetadata.toolCallHistory).toHaveLength(0);
    expect(enrichedContext.originalContext).toEqual(originalContext);
  });

  it("should correctly enrich context with tool call history when tool use occurred", async () => {
    const enricher = new StructuredToolOutputValidationContextEnricherV162();
    const history: ExecutionHistory = {
      messages: [
        { role: "user", content: "What is the weather?" },
        { role: "assistant", content: "Calling tool: get_weather", tool_use: { id: "call1", name: "get_weather", input: { location: "London" } } },
      ],
      tool_results: { get_weather: { content: "Sunny", is_error: false } },
    };
    const originalContext: any = { user_id: "user123" };

    const enrichedContext = await enricher.enrich(
      originalContext,
      history
    );

    expect(enrichedContext.historyMetadata.lastToolCallId).toBe("call1");
    expect(enrichedContext.historyMetadata.toolCallHistory).toHaveLength(1);
    expect(enrichedContext.historyMetadata.toolCallHistory[0].tool_use_id).toBe("call1");
    expect(enrichedContext.historyMetadata.toolCallHistory[0].name).toBe("get_weather");
    expect(enrichedContext.historyMetadata.toolCallHistory[0].input).toEqual({ location: "London" });
  });

  it("should handle multiple tool calls and results correctly", async () => {
    const enricher = new StructuredToolOutputValidationContextEnricherV162();
    const history: ExecutionHistory = {
      messages: [
        { role: "user", content: "First call" },
        { role: "assistant", content: "Calling tool: toolA", tool_use: { id: "callA", name: "toolA", input: { param1: 1 } } },
        { role: "tool", content: "Result A", tool_use_id: "callA" },
        { role: "assistant", content: "Second call", tool_use: { id: "callB", name: "toolB", input: { param2: "value" } } },
        { role: "tool", content: "Result B", tool_use_id: "callB" },
      ],
      tool_results: { toolA: { content: "Result A", is_error: false }, toolB: { content: "Result B", is_error: false } },
    };
    const originalContext: any = { user_id: "user123" };

    const enrichedContext = await enricher.enrich(
      originalContext,
      history
    );

    expect(enrichedContext.historyMetadata.lastToolCallId).toBe("callB");
    expect(enrichedContext.historyMetadata.toolCallHistory).toHaveLength(2);
    expect(enrichedContext.historyMetadata.toolCallHistory[0].tool_use_id).toBe("callA");
    expect(enrichedContext.historyMetadata.toolCallHistory[1].tool_use_id).toBe("callB");
  });
});