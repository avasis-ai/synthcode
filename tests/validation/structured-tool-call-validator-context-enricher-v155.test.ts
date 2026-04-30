import { describe, it, expect } from "vitest";
import { StructuredToolCallValidatorContextEnricher } from "../src/validation/structured-tool-call-validator-context-enricher-v155";
import { Message, ToolUseBlock } from "../src/validation/types";

describe("StructuredToolCallValidatorContextEnricher", () => {
  it("should correctly enrich the context with basic information", () => {
    const originalContext: {
      messages: Message[];
      last_tool_call: ToolUseBlock | null;
    } = {
      messages: [
        { id: "msg1", role: "user", content: "Hello" }
      ],
      last_tool_call: null
    };
    const toolCall: ToolUseBlock = {
      tool_name: "get_weather",
      tool_call_id: "call123",
      args: {
        location: "Tokyo"
      }
    };
    const dependencyContext = {
      source_message_id: "msg1",
      intended_path: "weather_api",
      required_dependencies: ["location"]
    };

    const enricher = new StructuredToolCallValidatorContextEnricher();
    const enrichedContext = enricher.enrich({
      context: originalContext,
      tool_call_to_validate: toolCall,
      dependency_context: dependencyContext
    });

    expect(enrichedContext).toEqual({
      original_context: originalContext,
      tool_call_to_validate: toolCall,
      dependency_context: dependencyContext
    });
  });

  it("should handle context with multiple messages and a previous tool call", () => {
    const originalContext: {
      messages: Message[];
      last_tool_call: ToolUseBlock | null;
    } = {
      messages: [
        { id: "msg1", role: "user", content: "What is the weather?" },
        { id: "msg2", role: "assistant", content: "Calling tool..." }
      ],
      last_tool_call: {
        tool_name: "get_weather",
        tool_call_id: "call123",
        args: {
          location: "Tokyo"
        }
      }
    };
    const toolCall: ToolUseBlock = {
      tool_name: "get_weather",
      tool_call_id: "call456",
      args: {
        location: "Osaka"
      }
    };
    const dependencyContext = {
      source_message_id: "msg2",
      intended_path: "weather_api",
      required_dependencies: ["location"]
    };

    const enricher = new StructuredToolCallValidatorContextEnricher();
    const enrichedContext = enricher.enrich({
      context: originalContext,
      tool_call_to_validate: toolCall,
      dependency_context: dependencyContext
    });

    expect(enrichedContext.original_context.messages.length).toBe(2);
    expect(enrichedContext.original_context.last_tool_call).toEqual({
      tool_name: "get_weather",
      tool_call_id: "call123",
      args: {
        location: "Tokyo"
      }
    });
    expect(enrichedContext.tool_call_to_validate).toEqual(toolCall);
  });

  it("should correctly assign dependency context when source message is the first one", () => {
    const originalContext: {
      messages: Message[];
      last_tool_call: ToolUseBlock | null;
    } = {
      messages: [
        { id: "msg_start", role: "user", content: "Start process" }
      ],
      last_tool_call: null
    };
    const toolCall: ToolUseBlock = {
      tool_name: "init_process",
      tool_call_id: "call_init",
      args: {}
    };
    const dependencyContext = {
      source_message_id: "msg_start",
      intended_path: "initialization",
      required_dependencies: []
    };

    const enricher = new StructuredToolCallValidatorContextEnricher();
    const enrichedContext = enricher.enrich({
      context: originalContext,
      tool_call_to_validate: toolCall,
      dependency_context: dependencyContext
    });

    expect(enrichedContext.dependency_context.source_message_id).toBe("msg_start");
    expect(enrichedContext.dependency_context.intended_path).toBe("initialization");
  });
});