import { describe, it, expect } from "vitest";
import { DependencyGraph } from "../src/graph/tool-call-dependency-graph-visualizer-mermaid-advanced-v103";

describe("DependencyGraph", () => {
  it("should correctly initialize with an empty graph", () => {
    const graph: DependencyGraph = { nodes: [] };
    expect(graph.nodes).toEqual([]);
  });

  it("should correctly build a simple linear dependency graph", () => {
    const graph: DependencyGraph = {
      nodes: [
        { id: "user1", type: "user", content: "Initial prompt" },
        { id: "assistant1", type: "assistant", content: "Response 1" },
        { id: "tool_result1", type: "tool_result", content: "Tool output" },
      ],
    };
    expect(graph.nodes.length).toBe(3);
    expect(graph.nodes[0].type).toBe("user");
    expect(graph.nodes[2].type).toBe("tool_result");
  });

  it("should handle a graph with conditional branching nodes", () => {
    const graph: DependencyGraph = {
      nodes: [
        { id: "start", type: "conditional_start", content: "Decision point" },
        { id: "path_a", type: "assistant", content: "Path A taken" },
        { id: "path_b", type: "assistant", content: "Path B taken" },
        { id: "end", type: "end", content: "Final conclusion" },
      ],
    };
    expect(graph.nodes.length).toBe(4);
    expect(graph.nodes.some(node => node.id === "start" && node.type === "conditional_start")).toBe(true);
    expect(graph.nodes.some(node => node.id === "end" && node.type === "end")).toBe(true);
  });
});