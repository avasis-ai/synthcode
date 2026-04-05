import { describe, it, expect } from "vitest";
import { ToolCallDependencyGraphVisualizerMermaid } from "../src/graph/tool-call-dependency-graph-visualizer-mermaid";
import { Message, ToolUseBlock } from "../src/graph/types";

describe("ToolCallDependencyGraphVisualizerMermaid", () => {
  it("should generate a basic graph definition for a single tool call", () => {
    const toolUseBlock: ToolUseBlock = {
      type: "tool_use",
      toolName: "get_weather",
      toolUseId: "call_1",
      input: { location: "Tokyo" },
    };
    const message: Message = {
      role: "user",
      contentBlocks: [toolUseBlock],
    };
    const visualizer = new ToolCallDependencyGraphVisualizerMermaid([message]);
    const graph = visualizer.generateGraph();

    expect(graph.graphDefinition).toContain("graph TD");
    expect(graph.nodes).toContain("A[User]");
    expect(graph.edges).toContain("A-->B(ToolCall)");
  });

  it("should generate a graph with multiple tool calls in sequence", () => {
    const toolUseBlock1: ToolUseBlock = {
      type: "tool_use",
      toolName: "get_weather",
      toolUseId: "call_1",
      input: { location: "Tokyo" },
    };
    const toolUseBlock2: ToolUseBlock = {
      type: "tool_use",
      toolName: "get_stock_price",
      toolUseId: "call_2",
      input: { ticker: "GOOGL" },
    };
    const message: Message = {
      role: "user",
      contentBlocks: [toolUseBlock1, toolUseBlock2],
    };
    const visualizer = new ToolCallDependencyGraphVisualizerMermaid([message]);
    const graph = visualizer.generateGraph();

    expect(graph.graphDefinition).toContain("A-->B(ToolCall)");
    expect(graph.graphDefinition).toContain("B-->C(ToolCall)");
  });

  it("should handle messages with mixed content (text and tool calls)", () => {
    const textBlock = { type: "text", content: "What is the weather and stock price?" };
    const toolUseBlock: ToolUseBlock = {
      type: "tool_use",
      toolName: "get_weather",
      toolUseId: "call_1",
      input: { location: "Tokyo" },
    };
    const message: Message = {
      role: "user",
      contentBlocks: [textBlock, toolUseBlock],
    };
    const visualizer = new ToolCallDependencyGraphVisualizerMermaid([message]);
    const graph = visualizer.generateGraph();

    expect(graph.graphDefinition).toContain("A[User]");
    expect(graph.graphDefinition).toContain("A-->B(ToolCall)");
  });
});