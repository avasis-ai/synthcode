import { describe, it, expect } from "vitest";
import { DependencyGraphVisualizerV23 } from "../src/visualization/dependency-graph-visualizer-v23";

describe("DependencyGraphVisualizerV23", () => {
  it("should initialize correctly with basic nodes and edges", () => {
    const visualizer = new DependencyGraphVisualizerV23();
    expect(visualizer).toBeDefined();
  });

  it("should add a node with correct metadata", () => {
    const visualizer = new DependencyGraphVisualizerV23();
    const nodeId = "node1";
    const nodeData = { id: nodeId, type: "agent", metadata: { name: "Agent A" } };
    visualizer.addNode(nodeId, nodeData);
    const nodes = visualizer.getNodes();
    expect(nodes.find(n => n.id === nodeId)).toEqual(expect.objectContaining({
      id: nodeId,
      type: "agent",
      metadata: { name: "Agent A" },
    }));
  });

  it("should add an edge between two existing nodes", () => {
    const visualizer = new DependencyGraphVisualizerV23();
    visualizer.addNode("source", { id: "source", type: "agent", metadata: {} });
    visualizer.addNode("target", { id: "target", type: "tool", metadata: {} });
    visualizer.addEdge("source", "target", { dependencyType: "CALLS" });
    const edges = visualizer.getEdges();
    expect(edges).toHaveLength(1);
    expect(edges[0]).toEqual(expect.objectContaining({
      source: "source",
      target: "target",
      metadata: { dependencyType: "CALLS" },
    }));
  });
});