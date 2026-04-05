import { describe, it, expect } from "vitest";
import { ToolCallDependencyGraphVisualizer } from "../src/graph/tool-call-dependency-graph-visualizer-mermaid-advanced-v37";
import { Message, ToolUseBlock } from "../src/graph/types";

describe("ToolCallDependencyGraphVisualizer", () => {
  it("should construct a basic graph from messages with sequential tool calls", () => {
    const messages: Message[] = [
      { role: "user", content: "Call tool A" },
      { role: "model", content: "ToolUseBlock", toolUse: { id: "toolA", name: "toolA" } },
      { role: "tool", content: "ToolOutputBlock", toolUseId: "toolA", output: "Success output A" },
      { role: "model", content: "ToolUseBlock", toolUse: { id: "toolB", name: "toolB" } },
    ];
    const visualizer = new ToolCallDependencyGraphVisualizer(messages);
    const graph = visualizer.construct();

    expect(graph.edges).toHaveLength(2);
    expect(graph.edges).toEqual(
      expect.arrayContaining([
        { from: "toolA", to: "toolB", label: "success" },
      ])
    );
  });

  it("should handle a graph with no tool calls", () => {
    const messages: Message[] = [
      { role: "user", content: "Hello world" },
      { role: "model", content: "Hello world" },
    ];
    const visualizer = new ToolCallDependencyGraphVisualizer(messages);
    const graph = visualizer.construct();

    expect(graph.edges).toHaveLength(0);
  });

  it("should correctly identify conditional edges when multiple tool uses are present", () => {
    const messages: Message[] = [
      { role: "user", content: "Try tool A, then conditionally use tool B" },
      { role: "model", content: "ToolUseBlock", toolUse: { id: "toolA", name: "toolA" } },
      { role: "tool", content: "ToolOutputBlock", toolUseId: "toolA", output: "Success output A" },
      { role: "model", content: "ToolUseBlock", toolUse: { id: "toolB", name: "toolB" } },
    ];
    const visualizer = new ToolCallDependencyGraphVisualizer(messages);
    const graph = visualizer.construct();

    expect(graph.edges).toHaveLength(2);
    expect(graph.edges).toEqual(
      expect.arrayContaining([
        { from: "toolA", to: "toolB", label: "success" },
      ])
    );
  });
});