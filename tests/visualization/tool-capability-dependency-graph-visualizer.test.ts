import { describe, it, expect } from "vitest";
import { CapabilityDependencyGraph } from "../src/visualization/tool-capability-dependency-graph-visualizer";

describe("CapabilityDependencyGraph", () => {
  it("should correctly initialize with empty arrays", () => {
    const graph: CapabilityDependencyGraph = {
      nodes: [],
      edges: [],
    };
    expect(graph.nodes).toEqual([]);
    expect(graph.edges).toEqual([]);
  });

  it("should correctly set nodes and edges when provided", () => {
    const nodes = [
      { id: "n1", name: "Node A", type: "capability", description: "Desc A" },
      { id: "n2", name: "Node B", type: "tool", description: "Desc B" },
    ];
    const edges = [
      { from: "n1", to: "n2", type: "requires", description: "A requires B" },
    ];
    const graph: CapabilityDependencyGraph = { nodes, edges };

    expect(graph.nodes).toEqual(nodes);
    expect(graph.edges).toEqual(edges);
  });

  it("should handle a graph with multiple nodes and edges", () => {
    const nodes = [
      { id: "c1", name: "Capability 1", type: "capability", description: "Desc C1" },
      { id: "t1", name: "Tool 1", type: "tool", description: "Desc T1" },
      { id: "c2", name: "Capability 2", type: "capability", description: "Desc C2" },
    ];
    const edges = [
      { from: "c1", to: "t1", type: "requires", description: "C1 requires T1" },
      { from: "t1", to: "c2", type: "enables", description: "T1 enables C2" },
    ];
    const graph: CapabilityDependencyGraph = { nodes, edges };

    expect(graph.nodes.length).toBe(3);
    expect(graph.edges.length).toBe(2);
    expect(graph.nodes.some(n => n.id === "c2" && n.type === "capability")).toBe(true);
    expect(graph.edges.some(e => e.from === "c1" && e.to === "t1" && e.type === "requires")).toBe(true);
  });
});