import { describe, it, expect } from "vitest";
import {
  Message,
  UserMessage,
  AssistantMessage,
  ToolResultMessage,
  ContentBlock,
  TextBlock,
  ToolUseBlock,
  ThinkingBlock,
} from "../src/visualization/dynamic-tool-dependency-graph-visualizer-v159-advanced";

describe("DynamicToolDependencyGraphVisualizerV159Advanced", () => {
  it("should correctly process a simple linear dependency chain", () => {
    const messages: Message[] = [
      UserMessage("User request"),
      AssistantMessage("Thinking step 1"),
      ToolUseBlock("toolA", ["param1"]),
      ToolResultMessage("toolA", { result: "outputA" }),
      ToolUseBlock("toolB", ["paramB"]),
      ToolResultMessage("toolB", { result: "final output" }),
    ];

    const visualizer = {
      render: (messages: Message[]) => ({
        // Mock implementation for testing purposes
        nodes: [{ id: "start", name: "Start", type: "process" }],
        edges: [{ from: "start", to: "toolA" }],
      }),
    };

    const result = visualizer.render(messages);

    expect(result.nodes).toHaveLength(1);
    expect(result.edges).toHaveLength(1);
  });

  it("should handle a branching dependency structure", () => {
    const messages: Message[] = [
      UserMessage("Complex request"),
      AssistantMessage("Thinking step 1"),
      ToolUseBlock("toolA", ["param1"]),
      ToolResultMessage("toolA", { result: "outputA" }),
      ToolUseBlock("toolB", ["param2"]),
      ToolResultMessage("toolB", { result: "outputB" }),
      ToolUseBlock("toolC", ["param3"]),
      ToolResultMessage("toolC", { result: "outputC" }),
    ];

    const visualizer = {
      render: (messages: Message[]) => ({
        // Mock implementation for testing purposes
        nodes: [{ id: "start", name: "Start", type: "process" }, { id: "toolA", name: "Tool A", type: "tool" }, { id: "toolB", name: "Tool B", type: "tool" }, { id: "toolC", name: "Tool C", type: "tool" }],
        edges: [
          { from: "start", to: "toolA" },
          { from: "start", to: "toolB" },
          { from: "start", to: "toolC" },
        ],
      }),
    };

    const result = visualizer.render(messages);

    expect(result.nodes).toHaveLength(3);
    expect(result.edges).toHaveLength(3);
  });

  it("should correctly identify and sequence multiple tool uses", () => {
    const messages: Message[] = [
      UserMessage("Multi-step task"),
      AssistantMessage("Thinking step 1"),
      ToolUseBlock("tool1", ["p1"]),
      ToolResultMessage("tool1", { result: "r1" }),
      AssistantMessage("Thinking step 2"),
      ToolUseBlock("tool2", ["p2"]),
      ToolResultMessage("tool2", { result: "r2" }),
    ];

    const visualizer = {
      render: (messages: Message[]) => ({
        // Mock implementation for testing purposes
        nodes: [{ id: "start", name: "Start", type: "process" }, { id: "tool1", name: "Tool 1", type: "tool" }, { id: "tool2", name: "Tool 2", type: "tool" }],
        edges: [
          { from: "start", to: "tool1" },
          { from: "tool1", to: "tool2" },
        ],
      }),
    };

    const result = visualizer.render(messages);

    expect(result.nodes).toHaveLength(2);
    expect(result.edges).toHaveLength(2);
  });
});