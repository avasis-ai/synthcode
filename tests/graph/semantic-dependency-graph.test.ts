import { describe, it, expect } from "vitest";
import { SemanticDependencyGraph } from "../src/graph/semantic-dependency-graph";

describe("SemanticDependencyGraph", () => {
  it("should initialize correctly with an empty graph", () => {
    const graph = new SemanticDependencyGraph();
    expect(graph.nodes.size).toBe(0);
    expect(graph.edges.size).toBe(0);
  });

  it("should add nodes and edges correctly", () => {
    const graph = new SemanticDependencyGraph();
    graph.addNode("node1", "Content A");
    graph.addNode("node2", "Content B");
    graph.addEdge("node1", "node2", "supports", 0.9, "Supports relationship");

    expect(graph.nodes.size).toBe(2);
    expect(graph.edges.size).toBe(1);
    expect(graph.getEdge("node1", "node2")).toBeDefined();
  });

  it("should retrieve node and edge information accurately", () => {
    const graph = new SemanticDependencyGraph();
    graph.addNode("n1", "Node 1 Content");
    graph.addNode("n2", "Node 2 Content");
    graph.addEdge("n1", "n2", "contradicts", 0.8, "Contradictory");

    const node = graph.getNode("n1");
    expect(node).toEqual({ id: "n1", content: "Node 1 Content" });

    const edge = graph.getEdge("n1", "n2");
    expect(edge).toEqual({
      sourceNodeId: "n1",
      targetNodeId: "n2",
      relationship: "contradicts",
      confidence: 0.8,
      description: "Contradictory",
    });
  });
});