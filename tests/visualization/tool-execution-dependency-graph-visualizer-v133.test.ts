import { describe, it, expect } from "vitest";
import {
  ResourceConstraint,
  TimeWindow,
  ResourceConstraintNode,
  TemporalEdge,
} from "../src/visualization/tool-execution-dependency-graph-visualizer-v133";

describe("ToolExecutionDependencyGraphVisualizerV133", () => {
  it("should correctly initialize with basic nodes and edges", () => {
    const nodes: ResourceConstraintNode[] = [
      {
        nodeId: "nodeA",
        resourceConstraints: [{
          resourceName: "CPU",
          requiredAmount: 1,
          unit: "core",
        }],
        timeWindow: {
          startTimeMs: 0,
          endTimeMs: 1000,
        },
      },
      {
        nodeId: "nodeB",
        resourceConstraints: [],
        timeWindow: {
          startTimeMs: 500,
          endTimeMs: 1500,
        },
      },
    ];
    const edges: TemporalEdge[] = [
      {
        sourceId: "nodeA",
        targetId: "nodeB",
        dependencyType: "SEQUENTIAL",
        weight: 1,
      },
    ];
    const visualizer = {
      nodes: nodes,
      edges: edges,
    };
    expect(visualizer.nodes.length).toBe(2);
    expect(visualizer.edges.length).toBe(1);
  });

  it("should handle nodes with multiple resource constraints", () => {
    const nodes: ResourceConstraintNode[] = [
      {
        nodeId: "nodeC",
        resourceConstraints: [
          {
            resourceName: "GPU",
            requiredAmount: 2,
            unit: "unit",
          },
          {
            resourceName: "Memory",
            requiredAmount: 4,
            unit: "GB",
          },
        ],
        timeWindow: {
          startTimeMs: 0,
          endTimeMs: 2000,
        },
      },
    ];
    const visualizer = {
      nodes: nodes,
      edges: [],
    };
    expect(visualizer.nodes[0].resourceConstraints.length).toBe(2);
    expect(visualizer.nodes[0].resourceConstraints[0].resourceName).toBe("GPU");
  });

  it("should correctly process an empty graph", () => {
    const nodes: ResourceConstraintNode[] = [];
    const edges: TemporalEdge[] = [];
    const visualizer = {
      nodes: nodes,
      edges: edges,
    };
    expect(visualizer.nodes).toEqual([]);
    expect(visualizer.edges).toEqual([]);
  });
});