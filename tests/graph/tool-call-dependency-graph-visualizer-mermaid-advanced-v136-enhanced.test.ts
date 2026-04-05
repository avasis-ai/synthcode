import { describe, it, expect } from "vitest";
import { ToolCallDependencyGraphVisualizerMermaidAdvancedV136Enhanced } from "../src/graph/tool-call-dependency-graph-visualizer-mermaid-advanced-v136-enhanced";

describe("ToolCallDependencyGraphVisualizerMermaidAdvancedV136Enhanced", () => {
  const visualizer = new ToolCallDependencyGraphVisualizerMermaidAdvancedV136Enhanced();

  it("should generate a basic graph structure for simple message flow", () => {
    const config = {
      messages: [
        { role: "user", content: "Hello world" },
        { role: "assistant", content: "Hi there!" },
      ],
    };
    const graph = visualizer.generateMermaidGraph(config);
    expect(graph).toContain("graph TD");
    expect(graph).toContain("A[User: Hello world]");
    expect(graph).toContain("B[Assistant: Hi there!]");
    expect(graph).toContain("A --> B");
  });

  it("should correctly represent a single tool call dependency", () => {
    const config = {
      messages: [
        { role: "user", content: "Get weather for London" },
        { role: "assistant", content: "ToolCall: get_weather(location='London')" },
        { role: "tool", content: "{\"temperature\": 20, \"unit\": \"C\"}" },
      ],
    };
    const graph = visualizer.generateMermaidGraph(config);
    expect(graph).toContain("A[User: Get weather for London]");
    expect(graph).toContain("B[Assistant: ToolCall: get_weather(location='London')]");
    expect(graph).toContain("C[Tool: {\"temperature\": 20, \"unit\": \"C\"}]");
    expect(graph).toContain("B --> C");
  });

  it("should handle multiple tool calls and sequential flow", () => {
    const config = {
      messages: [
        { role: "user", content: "What is the capital of France and what is the population?" },
        { role: "assistant", content: "ToolCall: get_capital(country='France')" },
        { role: "tool", content: "{\"capital\": \"Paris\"}" },
        { role: "assistant", content: "ToolCall: get_population(city='Paris')" },
        { role: "tool", content: "{\"population\": 2141000}" },
      ],
    };
    const graph = visualizer.generateMermaidGraph(config);
    expect(graph).toContain("A[User: What is the capital of France and what is the population?]");
    expect(graph).toContain("B[Assistant: ToolCall: get_capital(country='France')]");
    expect(graph).toContain("C[Tool: {\"capital\": \"Paris\"}]");
    expect(graph).toContain("D[Assistant: ToolCall: get_population(city='Paris')]");
    expect(graph).toContain("E[Tool: {\"population\": 2141000}]");
    expect(graph).toContain("A --> B");
    expect(graph).toContain("B --> C");
    expect(graph).toContain("C --> D");
    expect(graph).toContain("D --> E");
  });
});