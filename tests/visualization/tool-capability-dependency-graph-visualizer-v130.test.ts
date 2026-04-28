import { describe, it, expect } from "vitest";
import { CapabilityGraph, CapabilityNode, DependencyEdge } from "../src/visualization/tool-capability-dependency-graph-visualizer-v130";

describe("ToolCapabilityDependencyGraphVisualizer", () => {
  it("should correctly initialize with empty graph data", () => {
    const visualizer = new CapabilityGraph();
    expect(visualizer.nodes).toEqual([]);
    expect(visualizer.edges).toEqual([]);
  });

  it("should correctly add a single node", () => {
    const visualizer = new CapabilityGraph();
    const node: CapabilityNode = {
      id: "toolA",
      name: "Tool A",
      type: "tool",
      description: "A useful tool",
    };
    visualizer.addNode(node);
    expect(visualizer.nodes).toHaveLength(1);
    expect(visualizer.nodes[0]).toEqual(node);
  });

  it("should correctly add a dependency edge", () => {
    const visualizer = new CapabilityGraph();
    const edge: DependencyEdge = {
      source: "toolA",
      target: "capabilityB",
      dependencyType: "requires",
      reason: "Tool A needs capability B",
    };
    visualizer.addEdge(edge);
    expect(visualizer.edges).toHaveLength(1);
    expect(visualizer.edges[0]).toEqual(edge);
  });
});