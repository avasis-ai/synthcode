import { describe, it, expect } from "vitest";
import {
  DependencyGraphVisualizerV12,
  TemporalDependencyEdge,
  ResourceConstraint,
} from "../src/visualization/dependency-graph-visualizer-v12";

describe("DependencyGraphVisualizerV12", () => {
  it("should correctly initialize with empty data", () => {
    const visualizer = new DependencyGraphVisualizerV12();
    expect(visualizer).toBeDefined();
    expect(visualizer.nodes).toEqual([]);
    expect(visualizer.edges).toEqual([]);
  });

  it("should add nodes and edges correctly", () => {
    const visualizer = new DependencyGraphVisualizerV12();
    const nodes = [
      { id: "A", label: "Node A" },
      { id: "B", label: "Node B" },
    ];
    const edges: TemporalDependencyEdge[] = [
      {
        sourceNodeId: "A",
        targetNodeId: "B",
        constraints: [
          { resourceName: "CPU", startTime: 0, endTime: 10 },
        ],
        dependencyType: "sequential",
      },
    ];

    (visualizer as any).addNodes(nodes);
    (visualizer as any).addEdges(edges);

    expect(visualizer.nodes).toHaveLength(2);
    expect(visualizer.edges).toHaveLength(1);
    expect(visualizer.nodes[0].id).toBe("A");
    expect(visualizer.edges[0].sourceNodeId).toBe("A");
  });

  it("should handle multiple complex dependencies", () => {
    const visualizer = new DependencyGraphVisualizerV12();
    const nodes = [
      { id: "Start", label: "Start" },
      { id: "Task1", label: "Task 1" },
      { id: "Task2", label: "Task 2" },
      { id: "End", label: "End" },
    ];
    const edges: TemporalDependencyEdge[] = [
      {
        sourceNodeId: "Start",
        targetNodeId: "Task1",
        constraints: [],
        dependencyType: "sequential",
      },
      {
        sourceNodeId: "Task1",
        targetNodeId: "Task2",
        constraints: [
          { resourceName: "Memory", startTime: 5, endTime: 15 },
        ],
        dependencyType: "resource_lock",
      },
      {
        sourceNodeId: "Task2",
        targetNodeId: "End",
        constraints: [],
        dependencyType: "sequential",
      },
    ];

    (visualizer as any).addNodes(nodes);
    (visualizer as any).addEdges(edges);

    expect(visualizer.nodes).toHaveLength(4);
    expect(visualizer.edges).toHaveLength(2);
    expect(visualizer.edges[1].dependencyType).toBe("resource_lock");
  });
});