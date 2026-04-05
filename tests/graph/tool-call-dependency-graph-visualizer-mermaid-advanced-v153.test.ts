import { describe, it, expect } from "vitest";
import { DependencyGraph } from "../src/graph/tool-call-dependency-graph-visualizer-mermaid-advanced-v153";

describe("DependencyGraph", () => {
  it("should correctly initialize with empty arrays", () => {
    const graph: DependencyGraph = {
      nodes: [],
      edges: [],
    };
    expect(graph.nodes).toEqual([]);
    expect(graph.edges).toEqual([]);
  });

  it("should correctly add nodes and edges", () => {
    const graph: DependencyGraph = {
      nodes: [
        { id: "start", type: "start", metadata: {}, content: [] },
        { id: "tool1", type: "tool_call", metadata: {}, content: [] },
      ],
      edges: [
        { fromNodeId: "start", toNodeId: "tool1", type: "sequential" },
      ],
    };
    expect(graph.nodes.length).toBe(2);
    expect(graph.edges.length).toBe(1);
    expect(graph.nodes[0].id).toBe("start");
    expect(graph.edges[0].fromNodeId).toBe("start");
  });

  it("should handle complex graph structures with different edge types", () => {
    const graph: DependencyGraph = {
      nodes: [
        { id: "A", type: "start", metadata: {}, content: [] },
        { id: "B", type: "tool_call", metadata: {}, content: [] },
        { id: "C", type: "flow", metadata: {}, content: [] },
      ],
      edges: [
        { fromNodeId: "A", toNodeId: "B", type: "sequential" },
        { fromNodeId: "B", toNodeId: "C", type: "conditional", condition: "success" },
        { fromNodeId: "C", toNodeId: "A", type: "loop_exit" },
      ],
    };
    expect(graph.nodes.length).toBe(3);
    expect(graph.edges.length).toBe(3);
    expect(graph.edges).toContainEqual({
      fromNodeId: "A",
      toNodeId: "B",
      type: "sequential",
      condition: undefined,
    });
    expect(graph.edges).toContainEqual({
      fromNodeId: "B",
      toNodeId: "C",
      type: "conditional",
      condition: "success",
    });
  });
});