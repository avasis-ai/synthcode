import { describe, it, expect } from "vitest";
import {
  createStructuredToolCallValidatorContextEnricherV154AdvancedNew,
} from "../src/validation/structured-tool-call-validator-context-enricher-v154-advanced-new";
import {
  Message,
  UserMessage,
  AssistantMessage,
  ToolResultMessage,
  ContentBlock,
  TextBlock,
  ToolUseBlock,
  ThinkingBlock,
} from "../src/validation/types";

describe("createStructuredToolCallValidatorContextEnricherV154AdvancedNew", () => {
  it("should correctly enrich context with initial state and messages", () => {
    const initialContext = {
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: "Hello world" }],
          },
        ],
      ],
      currentState: {
        resourceUsage: {
          apiCalls: 5,
          memoryUsage: 1024,
        },
        activeConstraints: ["must_be_safe"],
      },
    };

    const enrichedContext = createStructuredToolCallValidatorContextEnricherV154AdvancedNew(
      initialContext
    );

    expect(enrichedContext.messages).toEqual(
      initialContext.messages
    );
    expect(enrichedContext.agentState).toEqual({
      resourceUsage: {
        apiCalls: 5,
        memoryUsage: 1024,
      },
      activeConstraints: ["must_be_safe"],
    });
  });

  it("should handle empty message history", () => {
    const initialContext = {
      messages: [],
      currentState: {
        resourceUsage: {},
        activeConstraints: [],
      },
    };

    const enrichedContext = createStructuredToolCallValidatorContextEnricherV154AdvancedNew(
      initialContext
    );

    expect(enrichedContext.messages).toEqual([]);
    expect(enrichedContext.agentState).toEqual({
      resourceUsage: {},
      activeConstraints: [],
    });
  });

  it("should correctly process a mix of message types", () => {
    const initialContext = {
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: "First message" }],
          },
        },
        {
          role: "assistant",
          content: [
            { type: "tool_use", toolUse: { name: "toolA", input: "data" } }],
          },
        ],
        {
          role: "tool",
          content: [
            { type: "tool_result", toolResultMessage: { toolCallId: "call1", content: "Success" } }],
          },
        ],
      ],
      currentState: {
        resourceUsage: {
          apiCalls: 1,
          memoryUsage: 2048,
        },
        activeConstraints: ["must_be_secure"],
      },
    };

    const enrichedContext = createStructuredToolCallValidatorContextEnricherV154AdvancedNew(
      initialContext
    );

    expect(enrichedContext.messages).toEqual(
      initialContext.messages
    );
    expect(enrichedContext.agentState.activeConstraints).toEqual(
      ["must_be_secure"]
    );
  });
});