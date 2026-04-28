import { describe, it, expect } from "vitest";
import {
  DependencyGraphVisualizerV128,
  DependencyEdge,
  ResourceUsage,
  TimeWindow,
} from "../src/visualization/tool-execution-dependency-graph-visualizer-v128";

describe("DependencyGraphVisualizerV128", () => {
  it("should correctly initialize with empty data", () => {
    const visualizer = new DependencyGraphVisualizerV128([]);
    expect(visualizer.getNodes()).toEqual([]);
    expect(visualizer.getEdges()).toEqual([]);
  });

  it("should process a single dependency edge correctly", () => {
    const edge: DependencyEdge = {
      sourceId: "A",
      targetId: "B",
      duration_ms: 100,
      resource_profile: {
        cpu_cores: 1,
        memory_gb: 2,
        network_throughput_mbps: 50,
      },
      temporal_constraint: {
        min_delay_ms: 50,
        max_delay_ms: 150,
      },
    };
    const visualizer = new DependencyGraphVisualizerV128([edge]);
    expect(visualizer.getEdges()).toHaveLength(1);
    expect(visualizer.getEdges()[0]).toEqual(edge);
  });

  it("should aggregate nodes and edges from multiple dependencies", () => {
    const edge1: DependencyEdge = {
      sourceId: "A",
      targetId: "B",
      duration_ms: 100,
      resource_profile: {
        cpu_cores: 1,
        memory_gb: 2,
        network_throughput_mbps: 50,
      },
      temporal_constraint: {
        min_delay_ms: 50,
        max_delay_ms: 150,
      },
    };
    const edge2: DependencyEdge = {
      sourceId: "B",
      targetId: "C",
      duration_ms: 200,
      resource_profile: {
        cpu_cores: 2,
        memory_gb: 4,
        network_throughput_mbps: 100,
      },
      temporal_constraint: {
        min_delay_ms: 100,
        max_delay_ms: 300,
      },
    };
    const visualizer = new DependencyGraphVisualizerV128([edge1, edge2]);
    expect(visualizer.getNodes()).toEqual(["A", "B", "C"]);
    expect(visualizer.getEdges()).toHaveLength(2);
  });
});