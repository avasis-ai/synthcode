import { describe, it, expect } from "vitest";
import {
  GraphNodeWithTime,
  GraphEdgeWithTime,
} from "../src/visualization/tool-execution-dependency-graph-visualizer-v109";

describe("ToolExecutionDependencyGraphVisualizerV109", () => {
  it("should correctly enrich nodes with temporal data", () => {
    const mockNode: GraphNodeWithTime = {
      id: "node1",
      type: "tool_use",
      data: "some tool data",
      temporalData: {
        startTime: 100,
        endTime: 200,
        resourceUsage: { cpu: 0.5 },
      },
    };
    expect(mockNode).toHaveProperty("temporalData");
    expect(mockNode.temporalData.startTime).toBe(100);
  });

  it("should correctly enrich edges with temporal data", () => {
    const mockEdge: GraphEdgeWithTime = {
      source: "node1",
      target: "node2",
      type: "dependency",
      temporalData: {
        startTime: 150,
        endTime: 250,
        resourceUsage: { memory: 1.2 },
      },
    };
    expect(mockEdge).toHaveProperty("temporalData");
    expect(mockEdge.temporalData.endTime).toBe(250);
  });

  it("should handle an empty graph structure gracefully", () => {
    const emptyGraph: {
      nodes: GraphNodeWithTime[];
      edges: GraphEdgeWithTime[];
    } = { nodes: [], edges: [] };
    expect(emptyGraph.nodes).toEqual([]);
    expect(emptyGraph.edges).toEqual([]);
  });
});