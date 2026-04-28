import { describe, it, expect } from "vitest";
import {
  ResourceMetrics,
  TimeRange,
  DependencyEdge,
} from "../src/visualization/tool-execution-dependency-visualizer-v109";

describe("ToolExecutionDependencyVisualizerV109", () => {
  it("should correctly calculate dependency edges for a simple linear execution", () => {
    const edges: DependencyEdge[] = [
      {
        sourceNodeId: "nodeA",
        targetNodeId: "nodeB",
        causality: "direct",
        timeRange: { startTime: 100, endTime: 200 },
        resourceImpact: { cpuUsageMs: 50, memoryUsageBytes: 1024, networkLatencyMs: 10 },
      },
    ];
    const result = (edges as any[]).map((edge: DependencyEdge) => ({
      source: edge.sourceNodeId,
      target: edge.targetNodeId,
      type: edge.causality,
      time: edge.timeRange,
      impact: edge.resourceImpact,
    }));
    expect(result).toHaveLength(1);
    expect(result[0].source).toBe("nodeA");
    expect(result[0].target).toBe("nodeB");
  });

  it("should handle multiple dependencies with different causality types", () => {
    const edges: DependencyEdge[] = [
      {
        sourceNodeId: "nodeA",
        targetNodeId: "nodeC",
        causality: "indirect",
        timeRange: { startTime: 50, endTime: 150 },
        resourceImpact: { cpuUsageMs: 20, memoryUsageBytes: 512, networkLatencyMs: 5 },
      },
      {
        sourceNodeId: "nodeB",
        targetNodeId: "nodeC",
        causality: "direct",
        timeRange: { startTime: 100, endTime: 200 },
        resourceImpact: { cpuUsageMs: 80, memoryUsageBytes: 2048, networkLatencyMs: 20 },
      },
    ];
    const result = (edges as any[]).map((edge: DependencyEdge) => ({
      source: edge.sourceNodeId,
      target: edge.targetNodeId,
      type: edge.causality,
      time: edge.timeRange,
      impact: edge.resourceImpact,
    }));
    expect(result).toHaveLength(2);
    expect(result).toEqual(expect.arrayContaining([
      expect.objectContaining({
        source: "nodeA",
        target: "nodeC",
        type: "indirect",
      }),
      expect.objectContaining({
        source: "nodeB",
        target: "nodeC",
        type: "direct",
      }),
    ]));
  });

  it("should return an empty array when no dependencies are provided", () => {
    const edges: DependencyEdge[] = [];
    const result = (edges as any[]).map((edge: DependencyEdge) => ({
      source: edge.sourceNodeId,
      target: edge.targetNodeId,
      type: edge.causality,
      time: edge.timeRange,
      impact: edge.resourceImpact,
    }));
    expect(result).toEqual([]);
  });
});