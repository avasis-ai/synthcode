import { describe, it, expect } from "vitest";
import { ToolCallDependencyGraphVisualizer, ToolCallDependencyGraphConfig } from "../src/graph/tool-call-dependency-graph-visualizer-mermaid-advanced-v109-enhanced";

describe("ToolCallDependencyGraphVisualizer", () => {
  it("should correctly build a simple dependency graph with required edges", () => {
    const config: ToolCallDependencyGraphConfig = {
      messages: [
        { role: "user", content: [{ type: "text", content: "What is the weather?" }] },
        { role: "model", content: [{ type: "tool_use", tool_use: { name: "get_weather", tool_call_id: "call_1" } }] },
        { role: "model", content: [{ type: "tool_use", tool_use: { name: "get_location", tool_call_id: "call_2" } }] },
      ],
      optionalEdgeEnabled: false,
      optionalEdgeStyle: "dashed",
    };
    const visualizer = new ToolCallDependencyGraphVisualizer(config);
    const graph = visualizer.buildGraph();

    expect(graph).toContain("A[User] --> B[ToolCall: get_weather]");
    expect(graph).toContain("B[ToolCall: get_weather] --> C[ToolCall: get_location]");
    expect(graph).not.toContain("optional");
  });

  it("should include optional edges when optionalEdgeEnabled is true", () => {
    const config: ToolCallDependencyGraphConfig = {
      messages: [
        { role: "user", content: [{ type: "text", content: "Plan a trip." }] },
        { role: "model", content: [{ type: "tool_use", tool_use: { name: "search_flights", tool_call_id: "call_1" } }] },
        { role: "model", content: [{ type: "tool_use", tool_use: { name: "search_hotels", tool_call_id: "call_2" } }] },
      ],
      optionalEdgeEnabled: true,
      optionalEdgeStyle: "dashed",
    };
    const visualizer = new ToolCallDependencyGraphVisualizer(config);
    const graph = visualizer.buildGraph();

    expect(graph).toContain("A[User] --> B[ToolCall: search_flights]");
    expect(graph).toContain("B[ToolCall: search_flights] --> C[ToolCall: search_hotels]");
    expect(graph).toContain("optional");
  });

  it("should handle graphs with only user input and no tool calls", () => {
    const config: ToolCallDependencyGraphConfig = {
      messages: [
        { role: "user", content: [{ type: "text", content: "Hello world." }] },
      ],
      optionalEdgeEnabled: false,
      optionalEdgeStyle: "dashed",
    };
    const visualizer = new ToolCallDependencyGraphVisualizer(config);
    const graph = visualizer.buildGraph();

    expect(graph).toContain("A[User] --> B[Text: Hello world.]");
    expect(graph.length).toBe(1);
  });
});