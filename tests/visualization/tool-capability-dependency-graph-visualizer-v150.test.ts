import { describe, it, expect } from "vitest";
import {
  CapabilityNode,
  CapabilityEdge,
  DependencyGraph,
} from "../src/visualization/tool-capability-dependency-graph-visualizer-v150";

describe("DependencyGraph", () => {
  it("should correctly initialize with empty arrays", () => {
    const graph: DependencyGraph = {
      nodes: [],
      edges: [],
    };
    expect(graph.nodes).toEqual([]);
    expect(graph.edges).toEqual([]);
  });

  it("should correctly add a single node", () => {
    const node: CapabilityNode = {
      id: "node1",
      name: "Node One",
      description: "Desc 1",
      metadata: {},
    };
    const graph: DependencyGraph = {
      nodes: [node],
      edges: [],
    };
    expect(graph.nodes).toHaveLength(1);
    expect(graph.nodes[0]).toEqual(node);
  });

  it("should correctly add multiple nodes and edges", () => {
    const node1: CapabilityNode = {
      id: "n1",
      name: "N1",
      description: "Desc N1",
      metadata: {},
    };
    const node2: CapabilityNode = {
      id: "n2",
      name: "N2",
      description: "Desc N2",
      metadata: {},
    };
    const edge: CapabilityEdge = {
      sourceId: "n1",
      targetId: "n2",
      type: "DEPENDS_ON",
      strength: 0.8,
      metadata: {},
    };
    const graph: DependencyGraph = {
      nodes: [node1, node2],
      edges: [edge],
    };
    expect(graph.nodes).toHaveLength(2);
    expect(graph.edges).toHaveLength(1);
    expect(graph.edges[0]).toEqual(edge);
  });
});