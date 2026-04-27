import { describe, it, expect } from "vitest";
import {
  DependencyGraphVisualizer,
  ResourceConstraint,
  TemporalMetadata,
  DependencyEdge,
} from "../src/visualization/dependency-graph-visualizer-v39";

describe("DependencyGraphVisualizer", () => {
  it("should correctly initialize with basic nodes and edges", () => {
    const nodes = [
      { id: "A", label: "Node A" },
      { id: "B", label: "Node B" },
    ];
    const edges: DependencyEdge[] = [
      {
        sourceId: "A",
        targetId: "B",
        causal: true,
        temporal: {
          startTime: 0,
          endTime: 10,
          duration: 10,
        },
      },
    ];
    const visualizer = new DependencyGraphVisualizer(nodes, edges);
    expect(visualizer.getNodes()).toHaveLength(2);
    expect(visualizer.getEdges()).toHaveLength(1);
  });

  it("should correctly calculate resource usage when constraints are provided", () => {
    const nodes = [
      { id: "A", label: "Node A" },
      { id: "B", label: "Node B" },
    ];
    const edges: DependencyEdge[] = [
      {
        sourceId: "A",
        targetId: "B",
        causal: true,
        temporal: {
          startTime: 0,
          endTime: 10,
          duration: 10,
        },
        constraints: {
          resourceName: "CPU",
          usage: 5,
          limit: 10,
        },
      },
    ];
    const visualizer = new DependencyGraphVisualizer(nodes, edges);
    const resourceUsage = visualizer.calculateResourceUsage("CPU");
    expect(resourceUsage).toBe(5);
  });

  it("should handle temporal metadata correctly for edge visualization", () => {
    const nodes = [
      { id: "Start", label: "Start" },
      { id: "End", label: "End" },
    ];
    const edges: DependencyEdge[] = [
      {
        sourceId: "Start",
        targetId: "End",
        causal: false,
        temporal: {
          startTime: 100,
          endTime: 200,
          duration: 100,
        },
      },
    ];
    const visualizer = new DependencyGraphVisualizer(nodes, edges);
    const edge = visualizer.getEdges()[0];
    expect(edge?.temporal.startTime).toBe(100);
    expect(edge?.temporal.duration).toBe(100);
  });
});