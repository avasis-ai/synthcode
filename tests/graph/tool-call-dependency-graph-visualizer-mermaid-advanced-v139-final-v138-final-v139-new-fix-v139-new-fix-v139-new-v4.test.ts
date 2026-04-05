import { describe, it, expect } from "vitest";
import { AdvancedGraph, AdvancedNode } from "../src/graph/tool-call-dependency-graph-visualizer-mermaid-advanced-v139-final-v138-final-v139-new-fix-v139-new-fix-v139-new-v4";

describe("AdvancedGraph", () => {
  it("should correctly initialize with empty arrays", () => {
    const graph: AdvancedGraph = {
      nodes: [],
      edges: [],
    };
    expect(graph.nodes).toEqual([]);
    expect(graph.edges).toEqual([]);
  });

  it("should correctly add a single node", () => {
    const node: AdvancedNode = {
      id: "user1",
      type: "user",
      content: [{ type: "text", content: "Hello" }],
      dependencies: [],
    };
    const graph: AdvancedGraph = {
      nodes: [node],
      edges: [],
    };
    expect(graph.nodes).toHaveLength(1);
    expect(graph.nodes[0]).toEqual(node);
  });

  it("should correctly add multiple nodes and edges", () => {
    const node1: AdvancedNode = {
      id: "user1",
      type: "user",
      content: [{ type: "text", content: "Start" }],
      dependencies: [],
    };
    const node2: AdvancedNode = {
      id: "assistant1",
      type: "assistant",
      content: [{ type: "text", content: "Response" }],
      dependencies: [],
    };
    const edge = {
      fromId: "user1",
      toId: "assistant1",
      relationship: "calls",
    };
    const graph: AdvancedGraph = {
      nodes: [node1, node2],
      edges: [edge],
    };
    expect(graph.nodes).toHaveLength(2);
    expect(graph.edges).toHaveLength(1);
    expect(graph.edges[0]).toEqual(edge);
  });
});