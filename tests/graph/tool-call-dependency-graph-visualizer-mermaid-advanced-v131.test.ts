import { describe, it, expect } from "vitest";
import { ToolCallDependencyGraphVisualizerMermaidAdvancedV131 } from "../src/graph/tool-call-dependency-graph-visualizer-mermaid-advanced-v131";

describe("ToolCallDependencyGraphVisualizerMermaidAdvancedV131", () => {
  const visualizer = new ToolCallDependencyGraphVisualizerMermaidAdvancedV131();

  it("should generate a basic graph for a simple user message", () => {
    const messages: Message[] = [
      { type: "user", content: { type: "text", text: "Hello world" } },
    ];
    const graph = visualizer.generateMermaidGraph(messages);
    expect(graph).toContain("graph TD");
    expect(graph).toContain("A[User: Hello world]");
    expect(graph).not.toContain("ToolCall");
  });

  it("should generate a graph showing a tool call and a result", () => {
    const messages: Message[] = [
      { type: "user", content: { type: "text", text: "Get weather in London" } },
      { type: "assistant", content: { type: "tool_use", tool_use: { name: "get_weather", input: "London" } } },
      { type: "tool_result", content: { type: "tool_result", tool_result: { name: "get_weather", content: "Sunny in London" } } },
    ];
    const graph = visualizer.generateMermaidGraph(messages);
    expect(graph).toContain("A[User: Get weather in London]");
    expect(graph).toContain("B[Tool Call: get_weather(London)]");
    expect(graph).toContain("C[Tool Result: Sunny in London]");
    expect(graph).toContain("A --> B");
    expect(graph).toContain("B --> C");
  });

  it("should handle a sequence with multiple interactions", () => {
    const messages: Message[] = [
      { type: "user", content: { type: "text", text: "What is the capital of France?" } },
      { type: "assistant", content: { type: "tool_use", tool_use: { name: "get_location", input: "France" } } },
      { type: "tool_result", content: { type: "tool_result", tool_result: { name: "get_location", content: "Paris" } } },
      { type: "assistant", content: { type: "text", text: "The capital of France is Paris." } },
    ];
    const graph = visualizer.generateMermaidGraph(messages);
    expect(graph).toContain("A[User: What is the capital of France?]");
    expect(graph).toContain("B[Tool Call: get_location(France)]");
    expect(graph).toContain("C[Tool Result: Paris]");
    expect(graph).toContain("D[Assistant: The capital of France is Paris.]");
    expect(graph).toContain("A --> B");
    expect(graph).toContain("B --> C");
    expect(graph).toContain("C --> D");
  });
});