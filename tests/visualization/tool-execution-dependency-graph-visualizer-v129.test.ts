import { describe, it, expect } from "vitest";
import {
  ToolExecutionDependencyGraphVisualizerV129,
  ResourceUsage,
  TimeWindow,
  TemporalResourceConstraint,
} from "../src/visualization/tool-execution-dependency-graph-visualizer-v129";

describe("ToolExecutionDependencyGraphVisualizerV129", () => {
  it("should correctly calculate total resource usage for a single tool execution", () => {
    const resourceUsage: ResourceUsage = {
      cpu_cores: 2,
      memory_gb: 4,
      network_bandwidth_mbps: 100,
    };
    const visualizer = new ToolExecutionDependencyGraphVisualizerV129();
    const totalUsage = visualizer.calculateTotalResourceUsage([resourceUsage]);

    expect(totalUsage.cpu_cores).toBe(2);
    expect(totalUsage.memory_gb).toBe(4);
    expect(totalUsage.network_bandwidth_mbps).toBe(100);
  });

  it("should correctly aggregate resource usage across multiple tool executions", () => {
    const resourceUsage1: ResourceUsage = {
      cpu_cores: 1,
      memory_gb: 2,
      network_bandwidth_mbps: 50,
    };
    const resourceUsage2: ResourceUsage = {
      cpu_cores: 3,
      memory_gb: 6,
      network_bandwidth_mbps: 150,
    };
    const visualizer = new ToolExecutionDependencyGraphVisualizerV129();
    const totalUsage = visualizer.calculateTotalResourceUsage([resourceUsage1, resourceUsage2]);

    expect(totalUsage.cpu_cores).toBe(4);
    expect(totalUsage.memory_gb).toBe(8);
    expect(totalUsage.network_bandwidth_mbps).toBe(200);
  });

  it("should handle an empty list of resource usages gracefully", () => {
    const visualizer = new ToolExecutionDependencyGraphVisualizerV129();
    const totalUsage = visualizer.calculateTotalResourceUsage([]);

    expect(totalUsage.cpu_cores).toBe(0);
    expect(totalUsage.memory_gb).toBe(0);
    expect(totalUsage.network_bandwidth_mbps).toBe(0);
  });
});