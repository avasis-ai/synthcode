import { describe, it, expect } from "vitest";
import {
  ToolExecutionDependencyGraphVisualizer,
  ResourceUsage,
  TemporalConstraint,
  NodeMetrics,
  EdgeMetrics,
} from "../src/visualization/tool-execution-dependency-graph-visualizer-v132";

describe("ToolExecutionDependencyGraphVisualizer", () => {
  it("should correctly initialize with empty data", () => {
    const visualizer = new ToolExecutionDependencyGraphVisualizer();
    expect(visualizer.getNodes()).toEqual([]);
    expect(visualizer.getEdges()).toEqual([]);
  });

  it("should add nodes and edges correctly when provided with sample data", () => {
    const node1: NodeMetrics = {
      nodeId: "nodeA",
      durationMs: 100,
      resources: [{
        resourceName: "cpu",
        requiredAmount: 1,
        unit: "core",
      }],
      temporal: {
        startTimeMs: 0,
        endTimeMs: 100,
      },
    };
    const node2: NodeMetrics = {
      nodeId: "nodeB",
      durationMs: 200,
      resources: [{
        resourceName: "memory",
        requiredAmount: 2,
        unit: "GB",
      }],
      temporal: {
        startTimeMs: 100,
        endTimeMs: 300,
      },
    };
    const edge1: EdgeMetrics = {
      sourceId: "nodeA",
      targetId: "nodeB",
      weight: 0.5,
    };

    const visualizer = new ToolExecutionDependencyGraphVisualizer();
    visualizer.addNode(node1);
    visualizer.addNode(node2);
    visualizer.addEdge(edge1);

    expect(visualizer.getNodes()).toHaveLength(2);
    expect(visualizer.getEdges()).toHaveLength(1);
    expect(visualizer.getNodeMetrics("nodeA")).toEqual(node1);
    expect(visualizer.getEdgeMetrics("nodeA", "nodeB")).toEqual(edge1);
  });

  it("should handle updates to existing nodes and edges", () => {
    const node1: NodeMetrics = {
      nodeId: "nodeA",
      durationMs: 100,
      resources: [],
      temporal: {
        startTimeMs: 0,
        endTimeMs: 100,
      },
    };
    const edge1: EdgeMetrics = {
      sourceId: "nodeA",
      targetId: "nodeB",
      weight: 0.1,
    };

    const visualizer = new ToolExecutionDependencyGraphVisualizer();
    visualizer.addNode(node1);
    visualizer.addNode({
      nodeId: "nodeB",
      durationMs: 100,
      resources: [],
      temporal: {
        startTimeMs: 0,
        endTimeMs: 100,
      },
    });
    visualizer.addEdge(edge1);

    // Update nodeA
    const updatedNode1: NodeMetrics = {
      nodeId: "nodeA",
      durationMs: 150,
      resources: [{
        resourceName: "cpu",
        requiredAmount: 1,
        unit: "core",
      }],
      temporal: {
        startTimeMs: 0,
        endTimeMs: 150,
      },
    };
    visualizer.updateNode(updatedNode1);

    // Update edge1
    const updatedEdge1: EdgeMetrics = {
      sourceId: "nodeA",
      targetId: "nodeB",
      weight: 0.9,
    };
    visualizer.updateEdge(updatedEdge1);

    expect(visualizer.getNodeMetrics("nodeA")).toEqual(updatedNode1);
    expect(visualizer.getEdgeMetrics("nodeA", "nodeB")).toEqual(updatedEdge1);
  });
});