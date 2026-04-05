import { describe, it, expect } from "vitest";
import { ToolCallDependencyGraphVisualizerMermaidAdvancedV144 } from "../src/graph/tool-call-dependency-graph-visualizer-mermaid-advanced-v144";

describe("ToolCallDependencyGraphVisualizerMermaidAdvancedV144", () => {
  it("should generate a basic graph for a simple user message", () => {
    const visualizer = new ToolCallDependencyGraphVisualizerMermaidAdvancedV144();
    const messages = [
      { type: "user", content: "Hello world" },
    ];
    const mermaidCode = visualizer.generateGraph(messages);
    expect(mermaidCode).toContain("graph TD");
    expect(mermaidCode).toContain("A[User: Hello world]");
  });

  it("should generate a graph with a tool call and response", () => {
    const visualizer = new ToolCallDependencyGraphVisualizerMermaidAdvancedV144();
    const messages = [
      { type: "user", content: "What is the weather?" },
      { type: "assistant", content: "Calling tool: get_weather", toolCalls: [{ name: "get_weather", arguments: { location: "London" } }] },
      { type: "tool_result", content: "{\"temperature\": 15, \"unit\": \"C\"}" },
    ];
    const mermaidCode = visualizer.generateGraph(messages);
    expect(mermaidCode).toContain("A[User: What is the weather?] --> B{Tool Call: get_weather}");
    expect(mermaidCode).toContain("B --> C[Tool Result: {\"temperature\": 15, \"unit\": \"C\"}]");
  });

  it("should handle multiple tool calls and dependencies", () => {
    const visualizer = new ToolCallDependencyGraphVisualizerMermaidAdvancedV144();
    const messages = [
      { type: "user", content: "Check weather and stock price" },
      { type: "assistant", content: "Calling tool: get_weather", toolCalls: [{ name: "get_weather", arguments: { location: "Paris" } }] },
      { type: "assistant", content: "Calling tool: get_stock", toolCalls: [{ name: "get_stock", arguments: { symbol: "GOOGL" } }] },
      { type: "tool_result", content: "{\"weather\": \"Sunny\"}" },
      { type: "tool_result", content: "{\"price\": 150.0}" },
    ];
    const mermaidCode = visualizer.generateGraph(messages);
    expect(mermaidCode).toContain("A[User: Check weather and stock price]");
    expect(mermaidCode).toContain("B{Tool Call: get_weather}");
    expect(mermaidCode).toContain("C{Tool Call: get_stock}");
    expect(mermaidCode).toContain("B --> D[Tool Result: {\"weather\": \"Sunny\"}]");
    expect(mermaidCode).toContain("C --> E[Tool Result: {\"price\": 150.0}]");
  });
});