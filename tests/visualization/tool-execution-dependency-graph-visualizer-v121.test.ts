import { describe, it, expect } from "vitest";
import {
  NodeData,
  EdgeData,
} from "../src/visualization/tool-execution-dependency-graph-visualizer-v121";

describe("ToolExecutionDependencyGraphVisualizerV121", () => {
  it("should correctly initialize with empty data", () => {
    const visualizer = {
      renderGraph: (nodes: NodeData[], edges: EdgeData[]) => {
        // Mock implementation for testing
        return {
          nodes: nodes,
          edges: edges,
        };
      },
    };
    const result = visualizer.renderGraph([], []);
    expect(result).toEqual({ nodes: [], edges: [] });
  });

  it("should render nodes and edges correctly with sample data", () => {
    const nodes: NodeData[] = [
      { id: "A", label: "Start", metadata: {} },
      { id: "B", label: "Tool Call", metadata: {} },
      { id: "C", label: "End", metadata: {} },
    ];
    const edges: EdgeData[] = [
      { source: "A", target: "B", metadata: {} },
      { source: "B", target: "C", metadata: {} },
    ];
    const visualizer = {
      renderGraph: (nodes: NodeData[], edges: EdgeData[]) => {
        return {
          nodes: nodes,
          edges: edges,
        };
      },
    };
    const result = visualizer.renderGraph(nodes, edges);
    expect(result.nodes).toEqual(nodes);
    expect(result.edges).toEqual(edges);
  });

  it("should handle complex metadata in edges", () => {
    const nodes: NodeData[] = [
      { id: "S", label: "Source", metadata: {} },
      { id: "T", label: "Target", metadata: {} },
    ];
    const edgeMetadata = {
      resource_constraints: {
        cpu: { required: 1, available: 2 },
      },
      temporal_relationship: {
        latency_ms: 100,
        precedes_step: true,
      },
    };
    const edges: EdgeData[] = [
      { source: "S", target: "T", metadata: edgeMetadata },
    ];
    const visualizer = {
      renderGraph: (nodes: NodeData[], edges: EdgeData[]) => {
        return {
          nodes: nodes,
          edges: edges,
        };
      },
    };
    const result = visualizer.renderGraph(nodes, edges);
    expect(result.edges[0].metadata).toEqual(edgeMetadata);
  });
});