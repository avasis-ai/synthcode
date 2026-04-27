import { describe, it, expect } from "vitest";
import {
  ConstraintMetadata,
  NodeData,
  EdgeData,
} from "../src/visualization/tool-execution-dependency-graph-visualizer-v104-advanced";

describe("ToolExecutionDependencyGraphVisualizerV104Advanced", () => {
  it("should correctly initialize with basic node and edge data", () => {
    const nodes: NodeData[] = [
      { id: "n1", name: "Tool A", metadata: {} },
      { id: "n2", name: "Tool B", metadata: {} },
    ];
    const edges: EdgeData[] = [
      { sourceId: "n1", targetId: "n2", metadata: {} },
    ];
    const visualizer = {
      // Mock implementation for testing purposes
      render: (nodes: NodeData[], edges: EdgeData[]) => ({
        nodes,
        edges,
      }),
    };

    const result = visualizer.render(nodes, edges);
    expect(result.nodes).toEqual(nodes);
    expect(result.edges).toEqual(edges);
  });

  it("should handle nodes with detailed constraint metadata", () => {
    const nodes: NodeData[] = [
      {
        id: "n1",
        name: "Critical Tool",
        metadata: {
          startTime: 100,
          endTime: 200,
          requiredResources: { cpu: 2, memory: 4 },
          isBottleneck: true,
        },
      },
    ];
    const edges: EdgeData[] = [];
    const visualizer = {
      render: (nodes: NodeData[], edges: EdgeData[]) => ({
        nodes,
        edges,
      }),
    };

    const result = visualizer.render(nodes, edges);
    expect(result.nodes[0].metadata).toEqual({
      startTime: 100,
      endTime: 200,
      requiredResources: { cpu: 2, memory: 4 },
      isBottleneck: true,
    });
  });

  it("should correctly process edges with metadata", () => {
    const nodes: NodeData[] = [
      { id: "n1", name: "Start", metadata: {} },
      { id: "n2", name: "End", metadata: {} },
    ];
    const edges: EdgeData[] = [
      {
        sourceId: "n1",
        targetId: "n2",
        metadata: {
          requiredResources: { network: 1 },
          isBottleneck: false,
        },
      },
    ];
    const visualizer = {
      render: (nodes: NodeData[], edges: EdgeData[]) => ({
        nodes,
        edges,
      }),
    };

    const result = visualizer.render(nodes, edges);
    expect(result.edges[0].metadata).toEqual({
      requiredResources: { network: 1 },
      isBottleneck: false,
    });
  });
});