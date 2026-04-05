import { describe, it, expect } from "vitest";
import { DependencyGraph } from "../src/graph/tool-dependency-graph-visualizer-enhanced";

describe("DependencyGraph", () => {
  it("should correctly initialize with empty arrays", () => {
    const graph: DependencyGraph = {
      nodes: [],
      edges: [],
    };
    expect(graph.nodes).toEqual([]);
    expect(graph.edges).toEqual([]);
  });

  it("should correctly set nodes and edges", () => {
    const mockNodes: any[] = [
      { tool_use_id: "t1", name: "ToolA", input: {}, metadata: {} },
      { tool_use_id: "t2", name: "ToolB", input: {}, metadata: {} },
    ];
    const mockEdges: any[] = [
      { source: "t1", target: "t2", dependency_type: "CALLS" },
    ];
    const graph: DependencyGraph = {
      nodes: mockNodes,
      edges: mockEdges,
    };
    expect(graph.nodes).toEqual(mockNodes);
    expect(graph.edges).toEqual(mockEdges);
  });

  it("should handle a graph with multiple nodes and edges", () => {
    const mockNodes: any[] = [
      { tool_use_id: "t1", name: "ToolA", input: {}, metadata: {} },
      { tool_use_id: "t2", name: "ToolB", input: {}, metadata: {} },
      { tool_use_id: "t3", name: "ToolC", input: {}, metadata: {} },
    ];
    const mockEdges: any[] = [
      { source: "t1", target: "t2", dependency_type: "CALLS" },
      { source: "t2", target: "t3", dependency_type: "USES_OUTPUT" },
    ];
    const graph: DependencyGraph = {
      nodes: mockNodes,
      edges: mockEdges,
    };
    expect(graph.nodes.length).toBe(3);
    expect(graph.edges.length).toBe(2);
    expect(graph.nodes[1].name).toBe("ToolB");
    expect(graph.edges[0].source).toBe("t1");
  });
});