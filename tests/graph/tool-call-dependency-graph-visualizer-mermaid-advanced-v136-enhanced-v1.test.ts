import { describe, it, expect } from "vitest";
import {
  DependencyGraph,
  GraphNode,
  GraphEdge,
} from "../src/graph/tool-call-dependency-graph-visualizer-mermaid-advanced-v136-enhanced-v1";

describe("DependencyGraph", () => {
  it("should correctly initialize with empty arrays", () => {
    const graph: DependencyGraph = {
      nodes: [],
      edges: [],
    };
    expect(graph.nodes).toEqual([]);
    expect(graph.edges).toEqual([]);
  });

  it("should correctly structure nodes and edges when populated", () => {
    const nodes: GraphNode[] = [
      { id: "user1", label: "User Input", type: "user" },
      { id: "assistant1", label: "Response", type: "assistant" },
    ];
    const edges: GraphEdge[] = [
      { from: "user1", to: "assistant1", label: "Triggers", condition: "always" },
    ];
    const graph: DependencyGraph = { nodes, edges };

    expect(graph.nodes.length).toBe(2);
    expect(graph.edges.length).toBe(1);
    expect(graph.nodes[0].id).toBe("user1");
    expect(graph.edges[0].from).toBe("user1");
  });

  it("should handle complex node and edge metadata", () => {
    const nodes: GraphNode[] = [
      { id: "tool_call", label: "Tool Call", type: "tool", metadata: { name: "search" } },
    ];
    const edges: GraphEdge[] = [
      { from: "start", to: "tool_call", label: "Call", metadata: { weight: 0.8 } },
    ];
    const graph: DependencyGraph = { nodes: nodes, edges: edges };

    expect(graph.nodes[0].metadata).toEqual({ name: "search" });
    expect(graph.edges[0].metadata).toEqual({ weight: 0.8 });
  });
});