import { describe, it, expect } from "vitest";
import { ToolCallDependencyGraphVisualizerMermaidAdvancedV23 } from "../src/graph/tool-call-dependency-graph-visualizer-mermaid-advanced-v23";

describe("ToolCallDependencyGraphVisualizerMermaidAdvancedV23", () => {
  it("should generate a basic graph structure for a simple user-assistant exchange", () => {
    const visualizer = new ToolCallDependencyGraphVisualizerMermaidAdvancedV23();
    const messages = [
      { type: "user", content: "Hello world" },
      { type: "assistant", content: "Hi there!" },
    ];
    const mermaidCode = visualizer.generateMermaid(messages);
    expect(mermaidCode).toContain("graph TD");
    expect(mermaidCode).toContain("User");
    expect(mermaidCode).toContain("Assistant");
  });

  it("should correctly include tool use and result nodes in the graph", () => {
    const visualizer = new ToolCallDependencyGraphVisualizerMermaidAdvancedV23();
    const messages = [
      { type: "user", content: "What is the weather?" },
      { type: "assistant", content: "Calling tool: get_weather", tool_use: { name: "get_weather", input: { location: "London" } } },
      { type: "tool_result", content: "{\"temperature\": 20, \"unit\": \"C\"}", tool_result: { name: "get_weather", result: { temperature: 20, unit: "C" } } },
      { type: "assistant", content: "The weather in London is 20C." },
    ];
    const mermaidCode = visualizer.generateMermaid(messages);
    expect(mermaidCode).toContain("User");
    expect(mermaidCode).toContain("ToolUse");
    expect(mermaidCode).toContain("ToolResult");
  });

  it("should handle a sequence with multiple tool calls and responses", () => {
    const visualizer = new ToolCallDependencyGraphVisualizerMermaidAdvancedV23();
    const messages = [
      { type: "user", content: "Get weather in Paris and time in Tokyo." },
      { type: "assistant", content: "Calling tool: get_weather", tool_use: { name: "get_weather", input: { location: "Paris" } } },
      { type: "tool_result", content: "{\"temperature\": 22, \"unit\": \"C\"}", tool_result: { name: "get_weather", result: { temperature: 22, unit: "C" } } },
      { type: "assistant", content: "Calling tool: get_time", tool_use: { name: "get_time", input: { city: "Tokyo" } } },
      { type: "tool_result", content: "{\"time\": \"10:00\"}", tool_result: { name: "get_time", result: { time: "10:00" } } },
      { type: "assistant", content: "Summary: Weather in Paris is 22C, and time in Tokyo is 10:00." },
    ];
    const mermaidCode = visualizer.generateMermaid(messages);
    expect(mermaidCode).toContain("get_weather");
    expect(mermaidCode).toContain("get_time");
    expect(mermaidCode).toContain("Summary");
  });
});