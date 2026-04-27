import { describe, it, expect } from "vitest";
import {
  DependencyGraphVisualizerV14,
  NodeData,
  ResourceConstraint,
  TemporalDependencyEdge,
} from "../src/visualization/dependency-graph-visualizer-v14";

describe("DependencyGraphVisualizerV14", () => {
  it("should initialize with default empty state", () => {
    const visualizer = new DependencyGraphVisualizerV14();
    expect(visualizer.nodes).toEqual([]);
    expect(visualizer.edges).toEqual([]);
    expect(visualizer.constraints).toEqual([]);
  });

  it("should add nodes and edges correctly", () => {
    const visualizer = new DependencyGraphVisualizerV14();
    const node1: NodeData = { id: "n1", label: "Agent A", type: "agent", position: { x: 10, y: 10 } };
    const node2: NodeData = { id: "n2", label: "Tool B", type: "tool", position: { x: 50, y: 50 } };
    const edge: TemporalDependencyEdge = { sourceId: "n1", targetId: "n2", startTime: 0, endTime: 100 };

    visualizer.addNode(node1);
    visualizer.addNode(node2);
    visualizer.addEdge(edge);

    expect(visualizer.nodes).toHaveLength(2);
    expect(visualizer.edges).toHaveLength(1);
    expect(visualizer.nodes).toContainEqual(node1);
    expect(visualizer.edges).toContainEqual(edge);
  });

  it("should add resource constraints correctly", () => {
    const visualizer = new DependencyGraphVisualizerV14();
    const constraint: ResourceConstraint = {
      resourceId: "cpu",
      nodeId: "n1",
      startTime: 0,
      endTime: 50,
      limit: 2,
    };

    visualizer.addConstraint(constraint);

    expect(visualizer.constraints).toHaveLength(1);
    expect(visualizer.constraints).toContainEqual(constraint);
  });
});