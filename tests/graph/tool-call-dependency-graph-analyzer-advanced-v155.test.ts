import { describe, it, expect } from "vitest";
import { ToolCallDependencyGraphAnalyzerAdvancedV155 } from "../src/graph/tool-call-dependency-graph-analyzer-advanced-v155";
import { Graph, Node, Edge } from "../src/graph/graph-structure";

describe("ToolCallDependencyGraphAnalyzerAdvancedV155", () => {
  it("should correctly build a simple linear dependency graph", () => {
    const analyzer = new ToolCallDependencyGraphAnalyzerAdvancedV155();
    const messages = [
      { role: "user", content: "What is the weather?" },
      { role: "assistant", content: [{ type: "text", content: "I need to check the weather." }] },
      { role: "tool", tool_use_id: "tool1", content: "Sunny", is_error: false },
      { role: "assistant", content: [{ type: "text", content: "It is sunny." }] },
    ];
    const graph = analyzer.analyze(messages);

    expect(graph).toBeInstanceOf(Graph);
    expect(graph.nodes.length).toBe(4);
    expect(graph.edges.length).toBe(2);
  });

  it("should handle multiple tool calls and dependencies", () => {
    const analyzer = new ToolCallDependencyGraphAnalyzerAdvancedV155();
    const messages = [
      { role: "user", content: "Get weather and stock price." },
      { role: "assistant", content: [{ type: "text", content: "Calling tools..." }] },
      { role: "tool", tool_use_id: "weather", content: "Sunny", is_error: false },
      { role: "tool", tool_use_id: "stock", content: "Price: 150", is_error: false },
      { role: "assistant", content: [{ type: "text", content: "Weather is sunny, stock is 150." }] },
    ];
    const graph = analyzer.analyze(messages);

    expect(graph).toBeInstanceOf(Graph);
    expect(graph.nodes.length).toBe(5);
    expect(graph.edges.length).toBeGreaterThanOrEqual(3);
  });

  it("should produce an empty graph for empty input messages", () => {
    const analyzer = new ToolCallDependencyGraphAnalyzerAdvancedV155();
    const messages: any[] = [];
    const graph = analyzer.analyze(messages);

    expect(graph).toBeInstanceOf(Graph);
    expect(graph.nodes.length).toBe(0);
    expect(graph.edges.length).toBe(0);
  });
});