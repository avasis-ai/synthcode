import { describe, it, expect } from "vitest";
import { GraphData } from "../src/graph/tool-call-dependency-graph-visualizer-mermaid-advanced-v115";

describe("GraphData structure", () => {
  it("should correctly structure nodes for a simple user-assistant interaction", () => {
    const graphData: GraphData = {
      nodes: [
        { id: "user_1", type: "user", content: { text: "Hello" } },
        { id: "assistant_1", type: "assistant", content: { text: "Hi there!" } },
      ],
      edges: [
        { from: "user_1", to: "assistant_1" },
      ],
    };
    expect(graphData.nodes).toHaveLength(2);
    expect(graphData.edges).toHaveLength(1);
    expect(graphData.nodes[0].type).toBe("user");
  });

  it("should handle tool use nodes and edges", () => {
    const graphData: GraphData = {
      nodes: [
        { id: "user_1", type: "user", content: { text: "What is the weather?" } },
        { id: "assistant_1", type: "assistant", content: { text: "Calling tool..." }, tool_uses: [{ name: "get_weather" }] },
        { id: "tool_result_1", type: "tool_result", content: { tool_name: "get_weather", result: "Sunny" } },
      ],
      edges: [
        { from: "user_1", to: "assistant_1" },
        { from: "assistant_1", to: "tool_result_1" },
      ],
    };
    expect(graphData.nodes).toHaveLength(3);
    expect(graphData.edges).toHaveLength(2);
    expect(graphData.nodes.find(n => n.id === "tool_result_1")?.type).toBe("tool_result");
  });

  it("should include fallback edges when specified", () => {
    const graphData: GraphData = {
      nodes: [
        { id: "user_1", type: "user", content: { text: "Test" } },
        { id: "assistant_1", type: "assistant", content: { text: "Response" } },
      ],
      edges: [
        { from: "user_1", to: "assistant_1", fallback: true, condition: "default" },
      ],
    };
    expect(graphData.edges).toHaveLength(1);
    expect(graphData.edges[0].fallback).toBe(true);
    expect(graphData.edges[0].condition).toBe("default");
  });
});