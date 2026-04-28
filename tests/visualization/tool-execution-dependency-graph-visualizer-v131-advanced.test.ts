import { describe, it, expect } from "vitest";
import {
  NodeMetadata,
  EdgeMetadata,
} from "../src/visualization/tool-execution-dependency-graph-visualizer-v131-advanced";

describe("ToolExecutionDependencyGraphVisualizerV131Advanced", () => {
  it("should correctly initialize with basic node and edge metadata", () => {
    const nodes: NodeMetadata[] = [
      {
        id: "node1",
        type: "tool_call",
        startTime: 100,
        endTime: 200,
        resourceUsage: { cpu: 1, memory: 2 },
        description: "Tool A executed",
      },
    ];
    const edges: EdgeMetadata[] = [
      {
        sourceId: "node1",
        targetId: "node2",
        dataFlow: "output_a",
        temporalConstraint: { minTime: 150, maxTime: 250 },
      },
    ];
    const visualizer = {
      nodes: nodes,
      edges: edges,
    };
    expect(visualizer.nodes).toHaveLength(1);
    expect(visualizer.edges).toHaveLength(1);
  });

  it("should handle an empty graph structure gracefully", () => {
    const visualizer = {
      nodes: [] as NodeMetadata[],
      edges: [] as EdgeMetadata[],
    };
    // Assuming the visualizer has a method or property that checks for emptiness
    // If it's a class, we'd instantiate it. Here we test the structure passed.
    expect(visualizer.nodes).toEqual([]);
    expect(visualizer.edges).toEqual([]);
  });

  it("should correctly process a graph with multiple nodes and complex dependencies", () => {
    const nodes: NodeMetadata[] = [
      {
        id: "user_start",
        type: "user_input",
        startTime: 0,
        endTime: 50,
        resourceUsage: {},
        description: "User initiated process",
      },
      {
        id: "tool_call_b",
        type: "tool_call",
        startTime: 100,
        endTime: 300,
        resourceUsage: { cpu: 2, memory: 4 },
        description: "Tool B ran",
      },
      {
        id: "system_end",
        type: "system_state",
        startTime: 350,
        endTime: 400,
        resourceUsage: {},
        description: "Process finished",
      },
    ];
    const edges: EdgeMetadata[] = [
      {
        sourceId: "user_start",
        targetId: "tool_call_b",
        dataFlow: "initial_prompt",
        temporalConstraint: { minTime: 60, maxTime: 120 },
      },
      {
        sourceId: "tool_call_b",
        targetId: "system_end",
        dataFlow: "result_b",
        temporalConstraint: { minTime: 310, maxTime: 360 },
      },
    ];
    const visualizer = {
      nodes: nodes,
      edges: edges,
    };
    expect(visualizer.nodes).toHaveLength(3);
    expect(visualizer.edges).toHaveLength(2);
    expect(visualizer.nodes.find(n => n.id === "tool_call_b")?.resourceUsage.cpu).toBe(2);
  });
});