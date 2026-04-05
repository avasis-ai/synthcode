import { describe, it, expect } from "vitest";
import { ToolCallDependencyGraphVisualizerMermaidAdvancedV11 } from "../src/graph/tool-call-dependency-graph-visualizer-mermaid-advanced-v11";
import { Message, ToolUseBlock, ThinkingBlock } from "../src/graph/types";

describe("ToolCallDependencyGraphVisualizerMermaidAdvancedV11", () => {
  it("should initialize correctly with an empty set of messages", () => {
    const visualizer = new ToolCallDependencyGraphVisualizerMermaidAdvancedV11([]);
    // We can't easily check private members, but we can check if it runs without error
    expect(visualizer).toBeInstanceOf(ToolCallDependencyGraphVisualizerMermaidAdvancedV11);
  });

  it("should generate a basic graph structure for a simple user-assistant exchange", () => {
    const messages: Message[] = [
      { type: "user", content: [{ type: "text", text: "Hello world" }] } as Message,
      { type: "assistant", content: [{ type: "text", text: "Hi there!" }] } as Message,
    ];
    const visualizer = new ToolCallDependencyGraphVisualizerMermaidAdvancedV11(messages);
    const graph = visualizer.generateGraph();
    expect(graph).toContain("graph TD");
    expect(graph).toContain("A[\"User Message\"] --> B[\"Assistant Message\"]");
  });

  it("should correctly model a sequence involving tool use and thinking", () => {
    const messages: Message[] = [
      { type: "user", content: [{ type: "text", text: "What is the weather?" }] } as Message,
      { type: "assistant", content: [{ type: "tool_use", tool_use: { name: "get_weather", input: "London" } }] } as Message,
      { type: "tool_result", content: [{ type: "text", text: "Sunny in London" }] } as Message,
    ];
    const visualizer = new ToolCallDependencyGraphVisualizerMermaidAdvancedV11(messages);
    const graph = visualizer.generateGraph();
    expect(graph).toContain("User -> ToolUse");
    expect(graph).toContain("ToolUse -> ToolResult");
  });
});