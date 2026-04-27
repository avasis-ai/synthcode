import { describe, it, expect } from "vitest";
import {
  DependencyGraphVisualizerV100,
  GraphNode,
  GraphEdge,
  ResourceConstraint,
  TemporalConstraint,
} from "../src/visualization/dependency-graph-visualizer-v100";

describe("DependencyGraphVisualizerV100", () => {
  it("should correctly initialize with empty data", () => {
    const visualizer = new DependencyGraphVisualizerV100();
    expect(visualizer).toBeDefined();
    expect(visualizer.nodes).toEqual([]);
    expect(visualizer.edges).toEqual([]);
  });

  it("should add nodes and edges correctly", () => {
    const visualizer = new DependencyGraphVisualizerV100();
    const node1: GraphNode = { id: "A", label: "Node A", metadata: {} };
    const node2: GraphNode = { id: "B", label: "Node B", metadata: {} };
    const edge1: GraphEdge = { sourceId: "A", targetId: "B" };

    (visualizer as any).addNode(node1);
    (visualizer as any).addEdge(edge1);

    expect(visualizer.nodes).toHaveLength(1);
    expect(visualizer.edges).toHaveLength(1);
    expect(visualizer.nodes[0]).toEqual(node1);
    expect(visualizer.edges[0]).toEqual(edge1);
  });

  it("should process resource and temporal constraints", () => {
    const visualizer = new DependencyGraphVisualizerV100();
    const resourceConstraint: ResourceConstraint = {
      resourceName: "CPU",
      requiredAmount: 2,
      unit: "cores",
    };
    const temporalConstraint: TemporalConstraint = {
      startTime: 100,
      endTime: 200,
      dependencyType: "precedes",
    };

    (visualizer as any).addResourceConstraint(resourceConstraint);
    (visualizer as any).addTemporalConstraint(temporalConstraint);

    // Assuming the visualizer has internal state or methods to track these
    // We check if the methods were called or if internal state reflects the addition
    expect((visualizer as any).resourceConstraints).toContainEqual(resourceConstraint);
    expect((visualizer as any).temporalConstraints).toContainEqual(temporalConstraint);
  });
});