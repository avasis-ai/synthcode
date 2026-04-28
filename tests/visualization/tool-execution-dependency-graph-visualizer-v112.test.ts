import { describe, it, expect } from "vitest";
import {
  GraphNode,
  ResourceUsage,
  TemporalConstraint,
  DependencyGraphVisualizer,
} from "../../../src/visualization/tool-execution-dependency-graph-visualizer-v112";

describe("DependencyGraphVisualizer", () => {
  it("should correctly initialize with basic nodes and edges", () => {
    const node1: GraphNode = {
      id: "node1",
      label: "Start",
      metadata: {},
      resource_usage: { cpu_cores: 1, memory_gb: 2, network_mbps: 10 },
      temporal_constraint: { start_time_ms: 0, end_time_ms: 1000 },
    };
    const node2: GraphNode = {
      id: "node2",
      label: "Process A",
      metadata: {},
      resource_usage: { cpu_cores: 2, memory_gb: 4, network_mbps: 20 },
      temporal_constraint: { start_time_ms: 500, end_time_ms: 1500 },
    };
    const edges = [{ source: "node1", target: "node2", weight: 1 }];

    const visualizer = new DependencyGraphVisualizer([node1, node2], edges);

    expect(visualizer.getNodes()).toHaveLength(2);
    expect(visualizer.getEdges()).toHaveLength(1);
    expect(visualizer.getNode("node1")).toBe(node1);
  });

  it("should calculate total resource usage correctly", () => {
    const node1: GraphNode = {
      id: "node1",
      label: "Node 1",
      metadata: {},
      resource_usage: { cpu_cores: 1, memory_gb: 2, network_mbps: 10 },
      temporal_constraint: { start_time_ms: 0, end_time_ms: 1000 },
    };
    const node2: GraphNode = {
      id: "node2",
      label: "Node 2",
      metadata: {},
      resource_usage: { cpu_cores: 2, memory_gb: 4, network_mbps: 20 },
      temporal_constraint: { start_time_ms: 500, end_time_ms: 1500 },
    };
    const edges = [{ source: "node1", target: "node2", weight: 1 }];

    const visualizer = new DependencyGraphVisualizer([node1, node2], edges);
    const totalResources = visualizer.getTotalResourceUsage();

    expect(totalResources.cpu_cores).toBe(3);
    expect(totalResources.memory_gb).toBe(6);
    expect(totalResources.network_mbps).toBe(30);
  });

  it("should calculate overall time span correctly", () => {
    const node1: GraphNode = {
      id: "node1",
      label: "Start",
      metadata: {},
      resource_usage: { cpu_cores: 1, memory_gb: 1, network_mbps: 1 },
      temporal_constraint: { start_time_ms: 0, end_time_ms: 100 },
    };
    const node2: GraphNode = {
      id: "node2",
      label: "Middle",
      metadata: {},
      resource_usage: { cpu_cores: 1, memory_gb: 1, network_mbps: 1 },
      temporal_constraint: { start_time_ms: 50, end_time_ms: 500 },
    };
    const node3: GraphNode = {
      id: "node3",
      label: "End",
      metadata: {},
      resource_usage: { cpu_cores: 1, memory_gb: 1, network_mbps: 1 },
      temporal_constraint: { start_time_ms: 400, end_time_ms: 1000 },
    };
    const edges = [
      { source: "node1", target: "node2", weight: 1 },
      { source: "node2", target: "node3", weight: 1 },
    ];

    const visualizer = new DependencyGraphVisualizer([node1, node2, node3], edges);
    const timeSpan = visualizer.getOverallTimeSpan();

    expect(timeSpan.start_time_ms).toBe(0);
    expect(timeSpan.end_time_ms).toBe(1000);
  });
});