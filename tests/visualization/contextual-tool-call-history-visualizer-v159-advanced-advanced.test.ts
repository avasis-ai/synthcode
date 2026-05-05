import { describe, it, expect } from "vitest";
import {
  VisualizationProps,
  AggregatedHistory,
} from "../src/visualization/contextual-tool-call-history-visualizer-v159-advanced-advanced";
import {
  Message,
  UserMessage,
  AssistantMessage,
  ToolResultMessage,
  ContentBlock,
  TextBlock,
  ToolUseBlock,
  ThinkingBlock,
} from "../src/visualization/types";

describe("ContextualToolCallHistoryVisualizerV159AdvancedAdvanced", () => {
  it("should render basic message history correctly", () => {
    const history: AggregatedHistory = {
      messages: [
        { type: "user", content: [
          { type: "text", text: "Hello world" }],
        ] as UserMessage;
      ],
      toolCalls: [],
      timeline: {
        // Minimal timeline for this test
      },
    };

    const { container } = renderComponent(
      <ContextualToolCallHistoryVisualizerV159AdvancedAdvanced history={history} />
    );

    expect(container).toHaveTextContent("Hello world");
  });

  it("should render a single tool call and its result", () => {
    const history: AggregatedHistory = {
      messages: [
        { type: "user", content: [
          { type: "text", text: "Call tool A" }],
        ] as UserMessage,
        { type: "assistant", content: [
          { type: "tool_use", toolUse: {
            toolName: "toolA",
            toolId: "id1",
            input: { query: "data" },
          }},
        ] as AssistantMessage },
        { type: "tool_result", content: [
          { type: "tool_result", toolResultMessage: {
            toolCallId: "id1",
            content: "Tool A executed successfully.",
          }},
        ] as ToolResultMessage },
      ],
      toolCalls: [
        {
          toolName: "toolA",
          toolId: "id1",
          input: { query: "data" },
          startTime: 100,
          endTime: 200,
          resourceUsage: { cpuMs: 50, memoryMb: 10 },
          dependencies: [],
        },
      ],
      timeline: {
        // Minimal timeline for this test
      },
    };

    const { container } = renderComponent(
      <ContextualToolCallHistoryVisualizerV159AdvancedAdvanced history={history} />
    );

    expect(container).toHaveTextContent("Call tool A");
    expect(container).toHaveTextContent("toolA");
    expect(container).toHaveTextContent("Tool A executed successfully.");
  });

  it("should render multiple messages with mixed content types", () => {
    const history: AggregatedHistory = {
      messages: [
        { type: "user", content: [
          { type: "text", text: "First message" }],
        ] as UserMessage,
        { type: "assistant", content: [
          { type: "thinking", thinking: { steps: ["Step 1", "Step 2"] } }
        ] as AssistantMessage },
        { type: "user", content: [
          { type: "text", text: "Second message" }],
        ] as UserMessage,
      ],
      toolCalls: [],
      timeline: {
        // Minimal timeline for this test
      },
    };

    const { container } = renderComponent(
      <ContextualToolCallHistoryVisualizerV159AdvancedAdvanced history={history} />
    );

    expect(container).toHaveTextContent("First message");
    expect(container).toHaveTextContent("Step 1");
    expect(container).toHaveTextContent("Second message");
  });
});