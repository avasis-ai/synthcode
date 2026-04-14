import { describe, it, expect } from "vitest";
import { ToolCallDependencyGraph, FlowEdgeType } from "../src/graph/tool-call-dependency-graph-visualizer-mermaid-advanced-v151-enhanced";

describe("ToolCallDependencyGraph", () => {
  it("should initialize with empty arrays", () => {
    const graph = new ToolCallDependencyGraph();
    expect(graph.nodes).toEqual([]);
    expect(graph.edges).toEqual([]);
  });

  it("should correctly add nodes and edges", () => {
    const graph = new ToolCallDependencyGraph();
    graph.addNode("nodeA");
    graph.addNode("nodeB");
    graph.addEdge("nodeA", "nodeB", FlowEdgeType.SEQUENTIAL);

    expect(graph.nodes).toEqual(["nodeA", "nodeB"]);
    expect(graph.edges).toHaveLength(1);
    expect(graph.edges[0].source).toBe("nodeA");
    expect(graph.edges[0].target).toBe("nodeB");
    expect(graph.edges[0].type).toBe(FlowEdgeType.SEQUENTIAL);
  });

  it("should handle adding multiple edges of different types", () => {
    const graph = new ToolCallDependencyGraph();
    graph.addNode("start");
    graph.addNode("condition");
    graph.addNode("end");

    graph.addEdge("start", "condition", FlowEdgeType.CONDITIONAL);
    graph.addEdge("condition", "end", FlowEdgeType.SEQUENTIAL);
    graph.addEdge("start", "end", FlowEdgeType.ASYNC_MESSAGE);

    expect(graph.nodes).toHaveLength(3);
    expect(graph.edges).toHaveLength(3);
    expect(graph.edges).toEqual(expect.arrayContaining([
      expect.objectContaining({ source: "start", target: "condition", type: FlowEdgeType.CONDITIONAL }),
      expect.objectContaining({ source: "condition", target: "end", type: FlowEdgeType.SEQUENTIAL }),
      expect.objectContaining({ source: "start", target: "end", type: FlowEdgeType.ASYNC_MESSAGE }),
    ]));
  });
});