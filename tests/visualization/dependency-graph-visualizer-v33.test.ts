import { describe, it, expect } from "vitest";
import { DependencyGraphVisualizerV33 } from "../src/visualization/dependency-graph-visualizer-v33";
import { DependencyGraph, Node, Edge } from "../src/visualization/dependency-graph-types";

describe("DependencyGraphVisualizerV33", () => {
  it("should correctly calculate causal flow edges for a simple graph", () => {
    const nodes: Node[] = [
      { id: "A", name: "Node A", type: "Component" },
      { id: "B", name: "Node B", type: "Service" },
    ];
    const edges: Edge[] = [
      { source: "A", target: "B", weight: 0.8 },
    ];
    const graph: DependencyGraph = { nodes, edges };

    const visualizer = new DependencyGraphVisualizerV33(graph);
    const causalEdges = visualizer["calculateCausalFlowEdges"](nodes, edges);

    expect(causalEdges).toHaveLength(1);
    expect(causalEdges[0].sourceNodeId).toBe("A");
    expect(causalEdges[0].targetNodeId).toBe("B");
    expect(causalEdges[0].strength).toBe(0.8);
    expect(causalEdges[0].influenceDescription).toBe("Direct dependency");
  });

  it("should handle graphs with multiple edges and nodes", () => {
    const nodes: Node[] = [
      { id: "N1", name: "Node 1", type: "Component" },
      { id: "N2", name: "Node 2", type: "Service" },
      { id: "N3", name: "Node 3", type: "Component" },
    ];
    const edges: Edge[] = [
      { source: "N1", target: "N2", weight: 0.9 },
      { source: "N2", target: "N3", weight: 0.5 },
      { source: "N1", target: "N3", weight: 0.2 },
    ];
    const graph: DependencyGraph = { nodes, edges };

    const visualizer = new DependencyGraphVisualizerV33(graph);
    const causalEdges = visualizer["calculateCausalFlowEdges"](nodes, edges);

    expect(causalEdges).toHaveLength(3);
    expect(causalEdges).toEqual(expect.arrayContaining([
      expect.objectContaining({ sourceNodeId: "N1", targetNodeId: "N2", strength: 0.9 }),
      expect.objectContaining({ sourceNodeId: "N2", targetNodeId: "N3", strength: 0.5 }),
      expect.objectContaining({ sourceNodeId: "N1", targetNodeId: "N3", strength: 0.2 }),
    ]));
  });

  it("should return an empty array for a graph with no edges", () => {
    const nodes: Node[] = [
      { id: "A", name: "Node A", type: "Component" },
      { id: "B", name: "Node B", type: "Service" },
    ];
    const edges: Edge[] = [];
    const graph: DependencyGraph = { nodes, edges };

    const visualizer = new DependencyGraphVisualizerV33(graph);
    const causalEdges = visualizer["calculateCausalFlowEdges"](nodes, edges);

    expect(causalEdges).toEqual([]);
  });
});