import { describe, it, expect } from "vitest";
import {
  GraphNode,
  GraphEdge,
  DependencyGraph,
} from "../src/visualization/tool-execution-dependency-graph-visualizer-v132-advanced";

describe("DependencyGraph", () => {
  it("should correctly build a graph from a set of nodes and edges", () => {
    const nodes: GraphNode[] = [
      {
        id: "nodeA",
        name: "Tool A",
        metrics: { cpuUsage: 0.5, memoryUsage: 100, durationMs: 50 },
        constraints: { startTimeMs: 0, endTimeMs: 100 },
      },
      {
        id: "nodeB",
        name: "Tool B",
        metrics: { cpuUsage: 0.8, memoryUsage: 200, durationMs: 150 },
        constraints: { startTimeMs: 50, endTimeMs: 250 },
      },
    ];
    const edges: GraphEdge[] = [
      { sourceId: "nodeA", targetId: "nodeB" },
    ];
    const graph = new DependencyGraph(nodes, edges);

    expect(graph.nodes.length).toBe(2);
    expect(graph.edges.length).toBe(1);
    expect(graph.hasEdge("nodeA", "nodeB")).toBe(true);
  });

  it("should handle disconnected nodes correctly", () => {
    const nodes: GraphNode[] = [
      {
        id: "nodeA",
        name: "Tool A",
        metrics: { cpuUsage: 0.5, memoryUsage: 100, durationMs: 50 },
        constraints: { startTimeMs: 0, endTimeMs: 100 },
      },
      {
        id: "nodeC",
        name: "Tool C",
        metrics: { cpuUsage: 0.3, memoryUsage: 50, durationMs: 30 },
        constraints: { startTimeMs: 200, endTimeMs: 300 },
      },
    ];
    const edges: GraphEdge[] = [
      { sourceId: "nodeA", targetId: "nodeB" }, // Note: nodeB is missing, testing robustness
    ];
    const graph = new DependencyGraph(nodes, edges);

    expect(graph.nodes.length).toBe(2);
    expect(graph.edges.length).toBe(1);
    expect(graph.hasEdge("nodeA", "nodeC")).toBe(false);
  });

  it("should return correct metrics for a given node", () => {
    const nodes: GraphNode[] = [
      {
        id: "nodeX",
        name: "Tool X",
        metrics: { cpuUsage: 0.9, memoryUsage: 300, durationMs: 200 },
        constraints: { startTimeMs: 10, endTimeMs: 300 },
      },
    ];
    const edges: GraphEdge[] = [];
    const graph = new DependencyGraph(nodes, edges);

    const node = graph.getNode("nodeX");
    expect(node).toBeDefined();
    expect(node.metrics.cpuUsage).toBe(0.9);
    expect(node.constraints.endTimeMs).toBe(300);
  });
});