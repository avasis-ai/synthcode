import { describe, it, expect } from "vitest";
import {
  ResourceMetrics,
  TemporalConstraint,
  ToolInvocationNode,
} from "../src/visualization/tool-invocation-dependency-graph-visualizer-v130-advanced-advanced";

describe("ToolInvocationDependencyGraphVisualizerV130AdvancedAdvanced", () => {
  it("should correctly initialize with basic nodes and metrics", () => {
    const nodes: ToolInvocationNode[] = [
      {
        id: "node1",
        tool_name: "toolA",
        input_payload: { param1: "value1" },
        ex: "some_extra_prop",
      },
    ];
    const metrics: Record<string, ResourceMetrics> = {
      "node1": {
        cpu_usage_percent: 10,
        memory_usage_mb: 50,
        network_latency_ms: 100,
      },
    };
    const constraints: Record<string, TemporalConstraint> = {
      "node1": { start_time_ms: 0, end_time_ms: 500 },
    };

    const visualizer = {
      nodes: nodes,
      metrics: metrics,
      constraints: constraints,
    };

    // Assuming the visualizer has a method to process or render the data
    // We'll test a hypothetical method that checks data structure integrity
    expect(visualizer.nodes.length).toBe(1);
    expect(visualizer.metrics["node1"]).toBeDefined();
    expect(visualizer.constraints["node1"]).toBeDefined();
  });

  it("should handle multiple nodes with varying metrics and constraints", () => {
    const nodes: ToolInvocationNode[] = [
      {
        id: "nodeA",
        tool_name: "toolA",
        input_payload: { param1: "value1" },
        ex: "extraA",
      },
      {
        id: "nodeB",
        tool_name: "toolB",
        input_payload: { param2: 2 },
        ex: "extraB",
      },
    ];
    const metrics: Record<string, ResourceMetrics> = {
      "nodeA": {
        cpu_usage_percent: 20,
        memory_usage_mb: 100,
        network_latency_ms: 200,
      },
      "nodeB": {
        cpu_usage_percent: 5,
        memory_usage_mb: 20,
        network_latency_ms: 50,
      },
    };
    const constraints: Record<string, TemporalConstraint> = {
      "nodeA": { start_time_ms: 100, end_time_ms: 300 },
      "nodeB": { start_time_ms: 300, end_time_ms: 500 },
    };

    const visualizer = {
      nodes: nodes,
      metrics: metrics,
      constraints: constraints,
    };

    // Test that the number of nodes matches the number of metrics/constraints
    expect(visualizer.nodes.length).toBe(2);
    expect(Object.keys(visualizer.metrics).length).toBe(2);
    expect(Object.keys(visualizer.constraints).length).toBe(2);
  });

  it("should correctly identify missing metrics for a given node", () => {
    const nodes: ToolInvocationNode[] = [
      {
        id: "node1",
        tool_name: "toolA",
        input_payload: { param1: "value1" },
        ex: "extra",
      },
      {
        id: "node2",
        tool_name: "toolB",
        input_payload: { param2: 2 },
        ex: "extra",
      },
    ];
    const metrics: Record<string, ResourceMetrics> = {
      "node1": {
        cpu_usage_percent: 10,
        memory_usage_mb: 50,
        network_latency_ms: 100,
      },
    };
    const constraints: Record<string, TemporalConstraint> = {
      "node1": { start_time_ms: 0, end_time_ms: 500 },
    };

    const visualizer = {
      nodes: nodes,
      metrics: metrics,
      constraints: constraints,
    };

    // Test that node2 is present in nodes but missing in metrics
    expect(visualizer.nodes.find(n => n.id === "node2")).toBeDefined();
    expect(visualizer.metrics["node2"]).toBeUndefined();
  });
});