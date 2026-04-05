import { describe, it, expect } from "vitest";
import { ToolCallDependencyGraphVisualizerMermaidBasic } from "../src/graph/tool-call-dependency-graph-visualizer-mermaid-basic";
import { Message, ToolUseBlock, TextBlock } from "../src/graph/types";

describe("ToolCallDependencyGraphVisualizerMermaidBasic", () => {
  it("should generate an empty graph when no tool calls are present", () => {
    const messages: Message[] = [
      { role: "user", content: [{ type: "text", text: "Hello world" }] },
      { role: "assistant", content: [{ type: "text", text: "Hello there!" }] },
    ];
    const visualizer = new ToolCallDependencyGraphVisualizerMermaidBasic(messages);
    const graph = visualizer.generateMermaidGraph();
    expect(graph).toContain("graph TD");
    expect(graph).not.toContain("A --> B"); // Should not contain any tool call dependencies
  });

  it("should generate a simple graph for a single tool call", () => {
    const messages: Message[] = [
      { role: "user", content: [{ type: "text", text: "What is the weather?" }] },
      { role: "assistant", content: [
        { type: "tool_use", tool_call: { id: "tool_1", name: "get_weather", input: { location: "Tokyo" } } },
      ], },
    ];
    const visualizer = new ToolCallDependencyGraphVisualizerMermaidBasic(messages);
    const graph = visualizer.generateMermaidGraph();
    expect(graph).toContain("A[User: What is the weather?] --> B[Tool Call: get_weather]");
    expect(graph).toContain("B --> C[Tool Output]");
  });

  it("should generate a graph for multiple sequential tool calls", () => {
    const messages: Message[] = [
      { role: "user", content: [{ type: "text", text: "First, get the weather, then search for restaurants." }] },
      { role: "assistant", content: [
        { type: "tool_use", tool_call: { id: "tool_1", name: "get_weather", input: { location: "Tokyo" } } },
      ], },
      { role: "tool", content: [{ type: "text", text: "Weather in Tokyo: Sunny" }] },
      { role: "assistant", content: [
        { type: "tool_use", tool_call: { id: "tool_2", name: "search_restaurants", input: { location: "Tokyo", cuisine: "Italian" } } },
      ], },
    ];
    const visualizer = new ToolCallDependencyGraphVisualizerMermaidBasic(messages);
    const graph = visualizer.generateMermaidGraph();
    expect(graph).toContain("A[User: First, get the weather, then search for restaurants.] --> B[Tool Call: get_weather]");
    expect(graph).toContain("B --> C[Tool Output]");
    expect(graph).toContain("C --> D[Tool Call: search_restaurants]");
  });
});