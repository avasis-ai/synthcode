import { describe, it, expect } from "vitest";
import {
  ToolExecutionDependencyGraphVisualizerV110Advanced,
  ToolExecutionNode,
  DependencyEdge,
} from "../src/visualization/tool-execution-dependency-graph-visualizer-v110-advanced";

describe("ToolExecutionDependencyGraphVisualizerV110Advanced", () => {
  it("should correctly initialize with empty data", () => {
    const visualizer = new ToolExecutionDependencyGraphVisualizerV110Advanced([]);
    expect(visualizer.getNodes()).toEqual([]);
    expect(visualizer.getEdges()).toEqual([]);
  });

  it("should process a single tool execution node correctly", () => {
    const node: ToolExecutionNode = {
      toolName: "toolA",
      toolUseId: "id1",
      startTimeMs: 1000,
      endTimeMs: 2000,
      resourceUsage: { cpuUtilization: 0.5, memoryUsageMB: 100 },
      input: { param1: "value" },
    };
    const visualizer = new ToolExecutionDependencyGraphVisualizerV110Advanced([node]);
    expect(visualizer.getNodes()).toHaveLength(1);
    expect(visualizer.getNodes()[0].toolName).toBe("toolA");
    expect(visualizer.getEdges()).toHaveLength(0);
  });

  it("should process nodes and edges correctly when dependencies exist", () => {
    const node1: ToolExecutionNode = {
      toolName: "toolA",
      toolUseId: "id1",
      startTimeMs: 1000,
      endTimeMs: 2000,
      resourceUsage: { cpuUtilization: 0.5, memoryUsageMB: 100 },
      input: { param1: "value" },
    };
    const node2: ToolExecutionNode = {
      toolName: "toolB",
      toolUseId: "id2",
      startTimeMs: 2000,
      endTimeMs: 3000,
      resourceUsage: { cpuUtilization: 0.3, memoryUsageMB: 50 },
      input: { param2: "other" },
    };
    const edge: DependencyEdge = {
      sourceToolUseId: "id1",
      targetToolUseId: "id2",
      dependencyType: "OUTPUT_TO_INPUT",
      reason: "toolA output feeds toolB input",
    };
    const visualizer = new ToolExecutionDependencyGraphVisualizerV110Advanced([node1, node2], [edge]);
    expect(visualizer.getNodes()).toHaveLength(2);
    expect(visualizer.getEdges()).toHaveLength(1);
    expect(visualizer.getEdges()[0].sourceToolUseId).toBe("id1");
  });
});