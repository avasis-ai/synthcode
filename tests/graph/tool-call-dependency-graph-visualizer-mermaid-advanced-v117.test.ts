import { describe, it, expect } from "vitest";
import { ToolCallDependencyGraphVisualizerMermaidAdvancedV117 } from "../src/graph/tool-call-dependency-graph-visualizer-mermaid-advanced-v117";
import { Message, UserMessage, AssistantMessage, ToolResultMessage } from "../src/graph/types";

describe("ToolCallDependencyGraphVisualizerMermaidAdvancedV117", () => {
  const visualizer = new ToolCallDependencyGraphVisualizerMermaidAdvancedV117();

  it("should generate a basic graph for a simple user message", () => {
    const messages: Message[] = [
      { type: "user", content: "Hello world" } as UserMessage,
    ];
    const graph = visualizer.visualize(messages);
    expect(graph).toContain("graph TD;");
    expect(graph).toContain("A[User Message]");
    expect(graph).toContain("A-->B");
  });

  it("should generate a graph showing tool use and result", () => {
    const messages: Message[] = [
      { type: "user", content: "What is the weather in London?" } as UserMessage,
      { type: "assistant", content: "ToolCall", toolUse: { name: "get_weather", arguments: { location: "London" } } } as AssistantMessage,
      { type: "tool_result", content: "ToolResult", toolResultMessage: { toolName: "get_weather", result: "Sunny" } } as ToolResultMessage,
    ];
    const graph = visualizer.visualize(messages);
    expect(graph).toContain("graph TD;");
    expect(graph).toContain("A[User Message]");
    expect(graph).toContain("B[Tool Call: get_weather]");
    expect(graph).toContain("C[Tool Result: Sunny]");
    expect(graph).toContain("A-->B");
    expect(graph).toContain("B-->C");
  });

  it("should handle multiple turns with mixed message types", () => {
    const messages: Message[] = [
      { type: "user", content: "First query" } as UserMessage,
      { type: "assistant", content: "Thinking", toolUse: { name: "search", arguments: { query: "first" } } } as AssistantMessage,
      { type: "tool_result", content: "ToolResult", toolResultMessage: { toolName: "search", result: "Search result for first" } } as ToolResultMessage,
      { type: "user", content: "Second query" } as UserMessage,
    ];
    const graph = visualizer.visualize(messages);
    expect(graph).toContain("graph TD;");
    expect(graph).toContain("A[User Message]");
    expect(graph).toContain("B[Tool Call: search]");
    expect(graph).toContain("C[Tool Result: Search result for first]");
    expect(graph).toContain("D[User Message]");
    expect(graph).toContain("A-->B");
    expect(graph).toContain("B-->C");
    expect(graph).toContain("C-->D");
  });
});