import { describe, it, expect } from "vitest";
import { ToolCallDependencyGraph } from "../src/graph/tool-call-dependency-graph-visualizer-mermaid-advanced-v17";

describe("ToolCallDependencyGraph", () => {
  it("should correctly build a simple linear dependency graph", () => {
    const graph = new ToolCallDependencyGraph();
    const nodes = [
      { id: "start", type: "message", content: "User input", style: { fill: "#e0f7fa" } },
      { id: "tool1_call", type: "tool_call", content: "call_tool_a", style: { fill: "#fff9c4" } },
      { id: "tool1_result", type: "tool_result", content: "result_a", style: { fill: "#c8e6c9" } },
      { id: "end", type: "message", content: "Final response", style: { fill: "#e8eaf0" } },
    ];
    const edges = [
      { fromId: "start", toId: "tool1_call", label: "calls" },
      { fromId: "tool1_call", toId: "tool1_result", label: "yields" },
      { fromId: "tool1_result", toId: "end", label: "used in" },
    ];
    graph.build(nodes, edges);

    expect(graph.nodes).toHaveLength(4);
    expect(graph.edges).toHaveLength(3);
    expect(graph.nodes.some(n => n.id === "tool1_call" && n.type === "tool_call")).toBe(true);
    expect(graph.edges.some(e => e.fromId === "start" && e.toId === "tool1_call" && e.label === "calls")).toBe(true);
  });

  it("should handle a graph with multiple parallel tool calls", () => {
    const graph = new ToolCallDependencyGraph();
    const nodes = [
      { id: "start", type: "message", content: "Complex query", style: { fill: "#e0f7fa" } },
      { id: "toolA_call", type: "tool_call", content: "call_tool_a", style: { fill: "#fff9c4" } },
      { id: "toolB_call", type: "tool_call", content: "call_tool_b", style: { fill: "#fff9c4" } },
      { id: "end", type: "message", content: "Combined result", style: { fill: "#e8eaf0" } },
    ];
    const edges = [
      { fromId: "start", toId: "toolA_call", label: "needs" },
      { fromId: "start", toId: "toolB_call", label: "needs" },
      { fromId: "toolA_call", toId: "end", label: "contributes" },
      { fromId: "toolB_call", toId: "end", label: "contributes" },
    ];
    graph.build(nodes, edges);

    expect(graph.nodes).toHaveLength(4);
    expect(graph.edges).toHaveLength(4);
    expect(graph.edges.filter(e => e.fromId === "start")).toHaveLength(2);
  });

  it("should result in empty graph if no nodes or edges are provided", () => {
    const graph = new ToolCallDependencyGraph();
    graph.build([], []);

    expect(graph.nodes).toHaveLength(0);
    expect(graph.edges).toHaveLength(0);
  });
});