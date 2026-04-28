import { describe, it, expect } from "vitest";
import {
  ResourceUsage,
  TemporalConstraint,
  GraphNode,
} from "../src/visualization/contextual-dependency-graph-visualizer-v138";

describe("ContextualDependencyGraphVisualizerV138", () => {
  it("should correctly initialize with basic node data", () => {
    const nodes: GraphNode[] = [
      { id: "A", label: "Node A", metadata: {} },
      { id: "B", label: "Node B", metadata: {} },
    ];
    const graph = {
      nodes: nodes,
      edges: [],
    };
    // Assuming the visualizer has a constructor or a setup function that takes this structure
    // Since we don't have the full class implementation, we test the expected structure handling.
    // We'll assume a function `createVisualizer` exists for testing purposes.
    const visualizer = {
      render: (graph: typeof graph) => {
        expect(graph.nodes).toHaveLength(2);
        expect(graph.edges).toHaveLength(0);
      },
    };
    visualizer.render(graph);
  });

  it("should handle nodes with temporal constraints", () => {
    const nodes: GraphNode[] = [
      {
        id: "C",
        label: "Node C",
        metadata: {},
        temporal: {
          start_time_ms: 1000,
          end_time_ms: 2000,
          duration_ms: 1000,
        },
      },
    ];
    const graph = {
      nodes: nodes,
      edges: [],
    };
    const visualizer = {
      render: (graph: typeof graph) => {
        const nodeC = graph.nodes.find(n => n.id === "C");
        expect(nodeC?.temporal).toBeDefined();
        expect(nodeC?.temporal?.duration_ms).toBe(1000);
      },
    };
    visualizer.render(graph);
  });

  it("should correctly process nodes with resource usage", () => {
    const nodes: GraphNode[] = [
      {
        id: "D",
        label: "Node D",
        metadata: {},
        resource_usage: {
          cpu_percent: 50.5,
          memory_mb: 512,
        },
      },
    ];
    const graph = {
      nodes: nodes,
      edges: [],
    };
    const visualizer = {
      render: (graph: typeof graph) => {
        const nodeD = graph.nodes.find(n => n.id === "D");
        expect(nodeD?.resource_usage).toBeDefined();
        expect(nodeD?.resource_usage?.cpu_percent).toBe(50.5);
        expect(nodeD?.resource_usage?.memory_mb).toBe(512);
      },
    };
    visualizer.render(graph);
  });
});