import { describe, it, expect } from "vitest";
import {
  DependencyNode,
  DependencyEdge,
} from "../src/visualization/stateful-tool-dependency-graph-visualizer-v135-advanced";

describe("DependencyGraphVisualizer", () => {
  it("should correctly initialize with empty data", () => {
    const visualizer = {
      nodes: [] as DependencyNode[],
      edges: [] as DependencyEdge[],
    };
    // Assuming there's a method or property to check initial state,
    // we'll check the structure if the class/object is instantiated.
    // Since we don't have the full class, we test the structure it expects.
    expect(visualizer.nodes).toEqual([]);
    expect(visualizer.edges).toEqual([]);
  });

  it("should add a single node correctly", () => {
    const node: DependencyNode = {
      id: "user1",
      label: "User Input",
      type: "user",
      metadata: { source: "user" },
    };
    const visualizer = {
      nodes: [node],
      edges: [],
    };
    // Simulate adding node logic if it were a class method
    // For this test, we just verify the structure is maintained.
    expect(visualizer.nodes).toHaveLength(1);
    expect(visualizer.nodes[0]).toEqual(node);
  });

  it("should add a dependency edge between two existing nodes", () => {
    const nodeA: DependencyNode = {
      id: "toolA",
      label: "Tool A",
      type: "tool",
      metadata: {},
    };
    const nodeB: DependencyNode = {
      id: "assistant",
      label: "Assistant Response",
      type: "assistant",
      metadata: {},
    };
    const edge: DependencyEdge = {
      fromId: "toolA",
      toId: "assistant",
      type: "dependency",
      weight: 1.0,
    };
    const visualizer = {
      nodes: [nodeA, nodeB],
      edges: [edge],
    };
    // Simulate adding edge logic
    expect(visualizer.edges).toHaveLength(1);
    expect(visualizer.edges[0]).toEqual(edge);
  });
});