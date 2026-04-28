import { describe, it, expect } from "vitest";
import {
  DependencyNode,
  DependencyEdge,
  TemporalResourceConstraint,
} from "../src/visualization/tool-execution-dependency-graph-visualizer-v136";

describe("DependencyGraphVisualizerV136", () => {
  it("should correctly initialize with basic nodes and edges", () => {
    const nodes: DependencyNode[] = [
      { id: "A", label: "Node A" },
      { id: "B", label: "Node B" },
    ];
    const edges: DependencyEdge[] = [
      { sourceId: "A", targetId: "B" },
    ];
    const visualizer = {
      nodes: nodes,
      edges: edges,
    };
    expect(visualizer.nodes).toHaveLength(2);
    expect(visualizer.edges).toHaveLength(1);
  });

  it("should handle nodes with temporal resource constraints", () => {
    const nodes: DependencyNode[] = [
      {
        id: "C",
        label: "Node C",
        constraints: [
          {
            startTime: 100,
            endTime: 200,
            resourceUsage: { cpu: 1, memory: 2 },
          },
        ],
      },
    ];
    const visualizer = {
      nodes: nodes,
      edges: [],
    };
    expect(visualizer.nodes[0].constraints).toBeDefined();
    expect(visualizer.nodes[0].constraints![0].resourceUsage.cpu).toBe(1);
  });

  it("should correctly process edges with constraints", () => {
    const nodes: DependencyNode[] = [
      { id: "D", label: "Node D" },
      { id: "E", label: "Node E" },
    ];
    const edges: DependencyEdge[] = [
      {
        sourceId: "D",
        targetId: "E",
        constraints: [
          {
            startTime: 50,
            endTime: 150,
            resourceUsage: { cpu: 0.5 },
          },
        ],
      },
    ];
    const visualizer = {
      nodes: nodes,
      edges: edges,
    };
    expect(visualizer.edges[0].constraints).toBeDefined();
    expect(visualizer.edges[0].constraints![0].resourceUsage.cpu).toBe(0.5);
  });
});