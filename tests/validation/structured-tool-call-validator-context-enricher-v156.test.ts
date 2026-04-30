import { describe, it, expect } from "vitest";
import { StructuredToolCallValidatorContextEnricher } from "../src/validation/structured-tool-call-validator-context-enricher-v156";
import { Message, UserMessage, AssistantMessage, ToolResultMessage, ContentBlock, TextBlock, ToolUseBlock, ThinkingBlock } from "../src/validation/types";

describe("StructuredToolCallValidatorContextEnricher", () => {
  it("should enrich context with recent tool calls when available", () => {
    const mockStateManager = {
      getRecentToolCalls: vi.fn().mockReturnValue([
        { tool_use_id: "id1", tool_name: "getWeather", input: { location: "London" } },
        { tool_use_id: "id2", tool_name: "searchWeb", input: { query: "AI trends" } },
      ]),
      getCurrentState: vi.fn().mockReturnValue({ user_id: "user123" }),
    };
    const mockToolRegistry = {
      getToolMetadata: vi.fn().mockImplementation((toolName) => {
        if (toolName === "getWeather") {
          return { description: "Gets weather", parameters: { location: { type: "string" } } };
        }
        return undefined;
      }),
      getAllToolNames: vi.fn().mockReturnValue(["getWeather", "searchWeb"]),
    };

    const enricher = new StructuredToolCallValidatorContextEnricher(mockStateManager, mockToolRegistry);
    const context = enricher.enrichContext(null as any, null as any);

    expect(mockStateManager.getRecentToolCalls).toHaveBeenCalledWith(10);
    expect(mockToolRegistry.getToolMetadata).toHaveBeenCalledWith("getWeather");
    expect(context).toHaveProperty("recentToolCalls");
    expect(context.recentToolCalls).toEqual([
      { tool_use_id: "id1", tool_name: "getWeather", input: { location: "London" } },
      { tool_use_id: "id2", tool_name: "searchWeb", input: { query: "AI trends" } },
    ]);
  });

  it("should handle no recent tool calls gracefully", () => {
    const mockStateManager = {
      getRecentToolCalls: vi.fn().mockReturnValue([]),
      getCurrentState: vi.fn().mockReturnValue({ user_id: "user123" }),
    };
    const mockToolRegistry = {
      getToolMetadata: vi.fn().mockReturnValue(undefined),
      getAllToolNames: vi.fn().mockReturnValue([]),
    };

    const enricher = new StructuredToolCallValidatorContextEnricher(mockStateManager, mockToolRegistry);
    const context = enricher.enrichContext(null as any, null as any);

    expect(mockStateManager.getRecentToolCalls).toHaveBeenCalledWith(10);
    expect(context).toHaveProperty("recentToolCalls");
    expect(context.recentToolCalls).toEqual([]);
  });

  it("should include current state and tool metadata in the enriched context", () => {
    const mockStateManager = {
      getRecentToolCalls: vi.fn().mockReturnValue([]),
      getCurrentState: vi.fn().mockReturnValue({ user_id: "user123", session_id: "sess456" }),
    };
    const mockToolRegistry = {
      getToolMetadata: vi.fn().mockImplementation((toolName) => {
        if (toolName === "getWeather") {
          return { description: "Gets weather", parameters: { location: { type: "string" } } };
        }
        return undefined;
      }),
      getAllToolNames: vi.fn().mockReturnValue(["getWeather"]),
    };

    const enricher = new StructuredToolCallValidatorContextEnricher(mockStateManager, mockToolRegistry);
    const context = enricher.enrichContext(null as any, null as any);

    expect(mockStateManager.getCurrentState).toHaveBeenCalled();
    expect(mockToolRegistry.getToolMetadata).toHaveBeenCalledWith("getWeather");
    expect(context).toHaveProperty("currentState");
    expect(context.currentState).toEqual({ user_id: "user123", session_id: "sess456" });
  });
});