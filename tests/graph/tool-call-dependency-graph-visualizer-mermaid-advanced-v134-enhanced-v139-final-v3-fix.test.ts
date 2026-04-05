import { describe, it, expect } from "vitest";
import { DependencyGraph } from "../src/graph/tool-call-dependency-graph-visualizer-mermaid-advanced-v134-enhanced-v139-final-v3-fix";

describe("DependencyGraph", () => {
  it("should correctly initialize with empty arrays", () => {
    const graph = new DependencyGraph();
    expect(graph.nodes).toEqual([]);
    expect(graph.edges).toEqual([]);
  });

  it("should add nodes and edges correctly", () => {
    const graph = new DependencyGraph();
    const node1: FlowNode = {
      id: "start",
      type: "start",
      content: "Start",
      inputs: [],
      outputs: [],
    };
    const node2: FlowNode = {
      id: "process",
      type: "process",
      content: "Process",
      inputs: ["input1"],
      outputs: [],
    };
    graph.addNode(node1);
    graph.addNode(node2);

    graph.addEdge(node1.id, node2.id);

    expect(graph.nodes).toHaveLength(2);
    expect(graph.edges).toHaveLength(1);
    expect(graph.edges[0].fromId).toBe("start");
    expect(graph.edges[0].toId).toBe("process");
  });

  it("should handle adding duplicate nodes and edges gracefully", () => {
    const graph = new DependencyGraph();
    const node1: FlowNode = {
      id: "start",
      type: "start",
      content: "Start",
      inputs: [],
      outputs: [],
    };
    graph.addNode(node1);

    // Attempt to add duplicate node
    graph.addNode(node1);

    // Add edge
    graph.addEdge("start", "process");

    // Attempt to add duplicate edge (assuming addEdge handles this)
    graph.addEdge("start", "process");

    // Check counts (should remain the same)
    expect(graph.nodes).toHaveLength(1);
    expect(graph.edges).toHaveLength(1);
  });
});