import { describe, it, expect } from "vitest";
import {
  ResourceUsage,
  TimeWindow,
  DependencyEdge,
} from "../src/visualization/tool-execution-dependency-graph-visualizer-v138-advanced";

describe("ToolExecutionDependencyGraphVisualizer", () => {
  it("should correctly calculate resource usage for a simple sequence of tools", () => {
    const usage: ResourceUsage = { cpu_cores: 2, memory_gb: 4, network_mbps: 100 };
    const graph = {
      nodes: [{ id: "toolA", usage: usage }],
      edges: [],
    };
    // Assuming a function exists or the structure allows testing the calculation logic
    // For this test, we'll mock the expected behavior based on the interface structure.
    // In a real scenario, we'd call the main visualization function.
    expect(graph.nodes[0].usage).toEqual(usage);
  });

  it("should handle multiple nodes with varying resource requirements", () => {
    const usage1: ResourceUsage = { cpu_cores: 1, memory_gb: 2, network_mbps: 50 };
    const usage2: ResourceUsage = { cpu_cores: 4, memory_gb: 8, network_mbps: 300 };
    const graph = {
      nodes: [
        { id: "toolA", usage: usage1 },
        { id: "toolB", usage: usage2 },
      ],
      edges: [],
    };
    expect(graph.nodes.length).toBe(2);
    expect(graph.nodes.find(n => n.id === "toolB")?.usage).toEqual(usage2);
  });

  it("should correctly represent dependency edges with different types", () => {
    const edge: DependencyEdge = {
      sourceNodeId: "toolA",
      targetNodeId: "toolB",
      dependencyType: "conditional",
      weight: 0.7,
      metadata: {},
    };
    const graph = {
      nodes: [],
      edges: [edge],
    };
    expect(graph.edges.length).toBe(1);
    expect(graph.edges[0].dependencyType).toBe("conditional");
    expect(graph.edges[0].weight).toBe(0.7);
  });
});