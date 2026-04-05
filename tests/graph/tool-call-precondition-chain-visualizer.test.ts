import { describe, it, expect } from "vitest";
import { PreconditionGraph, GraphNode, GraphEdge } from "../src/graph/tool-call-precondition-chain-visualizer";

describe("PreconditionGraph", () => {
  it("should correctly initialize an empty graph", () => {
    const graph: PreconditionGraph = {
      nodes: [],
      edges: [],
    };
    expect(graph.nodes).toEqual([]);
    expect(graph.edges).toEqual([]);
  });

  it("should correctly add nodes to the graph", () => {
    const node1: GraphNode = {
      id: "n1",
      label: "Check A",
      type: "precondition",
      details: "Details for A",
    };
    const node2: GraphNode = {
      id: "n2",
      label: "Check B",
      type: "precondition",
      details: "Details for B",
    };
    const graph: PreconditionGraph = {
      nodes: [node1, node2],
      edges: [],
    };
    expect(graph.nodes).toHaveLength(2);
    expect(graph.nodes).toContainEqual(node1);
    expect(graph.nodes).toContainEqual(node2);
  });

  it("should correctly add edges between nodes", () => {
    const graph: PreconditionGraph = {
      nodes: [
        { id: "n1", label: "Start", type: "precondition", details: "" },
        { id: "n2", label: "End", type: "precondition", details: "" },
      ],
      edges: [
        { sourceId: "n1", targetId: "n2", label: "Success" },
      ],
    };
    expect(graph.edges).toHaveLength(1);
    expect(graph.edges[0]).toEqual({
      sourceId: "n1",
      targetId: "n2",
      label: "Success",
    });
  });
});