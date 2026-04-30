import { describe, it, expect } from "vitest";
import {
  StructuredToolCallValidatorContextEnricherV169AdvancedAdvanced,
} from "../src/validation/structured-tool-call-validator-context-enricher-v169-advanced-advanced";
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

describe("StructuredToolCallValidatorContextEnricherV169AdvancedAdvanced", () => {
  it("should enrich context with temporal and dependency information for a simple conversation", async () => {
    const messages: Message[] = [
      {
        role: "user",
        content: [
          { type: "text", text: "What is the capital of France?" },
        ],
        timestamp: 1672531200000,
      },
      {
        role: "assistant",
        content: [
          { type: "tool_use", toolUse: { name: "get_location", input: "France" } },
        ],
        timestamp: 1672531205000,
      },
      {
        role: "tool",
        content: [
          { type: "text", text: "The capital of France is Paris." },
        ],
        timestamp: 1672531210000,
      },
    ];

    const enrichedContext = await StructuredToolCallValidatorContextEnricherV169AdvancedAdvanced.enrich(
      messages,
    );

    expect(enrichedContext).toBeDefined();
    expect(enrichedContext?.temporalContext).toBeDefined();
    expect(enrichedContext?.dependencyLinks).toHaveLength(1);
    expect(enrichedContext?.dependencyLinks![0].sourceId).toBe("user_message_1");
    expect(enrichedContext?.dependencyLinks![0].targetId).toBe("assistant_message_2");
  });

  it("should handle context with multiple tool uses and dependencies", async () => {
    const messages: Message[] = [
      {
        role: "user",
        content: [
          { type: "text", text: "First, check the weather in London, then what is the population of Tokyo?" },
        ],
        timestamp: 1672531200000,
      },
      {
        role: "assistant",
        content: [
          { type: "tool_use", toolUse: { name: "get_weather", input: "London" } },
        ],
        timestamp: 1672531205000,
      },
      {
        role: "tool",
        content: [
          { type: "text", text: "Weather in London: 15C." },
        ],
        timestamp: 1672531210000,
      },
      {
        role: "user",
        content: [
          { type: "tool_use", toolUse: { name: "get_population", input: "Tokyo" } },
        ],
        timestamp: 1672531220000,
      },
    ];

    const enrichedContext = await StructuredToolCallValidatorContextEnricherV169AdvancedAdvanced.enrich(
      messages,
    );

    expect(enrichedContext).toBeDefined();
    expect(enrichedContext?.dependencyLinks).toHaveLength(2);
    expect(enrichedContext?.dependencyLinks).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          sourceId: "user_message_1",
          targetId: "assistant_message_2",
          dependencyType: "succeeds",
        }),
        expect.objectContaining({
          sourceId: "tool_message_3",
          targetId: "user_message_4",
          dependencyType: "requires",
        }),
      ]),
    );
  });

  it("should correctly calculate temporal context for a long interaction", async () => {
    const messages: Message[] = [
      {
        role: "user",
        content: [
          { type: "text", text: "Start conversation" },
        ],
        timestamp: 1000,
      },
      {
        role: "assistant",
        content: [
          { type: "text", text: "Response 1" },
        ],
        timestamp: 2000,
      },
      {
        role: "user",
        content: [
          { type: "text", text: "Follow up" },
        ],
        timestamp: 3000,
      },
      {
        role: "assistant",
        content: [
          { type: "text", text: "Response 2" },
        ],
        timestamp: 5000,
      },
    ];

    const enrichedContext = await StructuredToolCallValidatorContextEnricherV169AdvancedAdvanced.enrich(
      messages,
    );

    expect(enrichedContext?.temporalContext).toBeDefined();
    expect(enrichedContext?.temporalContext?.startTime).toBe(1000);
    expect(enrichedContext?.temporalContext?.endTime).toBe(5000);
    expect(enrichedContext?.temporalContext?.durationMs).toBe(4000);
  });
});