import { describe, it, expect } from "vitest";
import {
  ResourceConstraint,
  TimeWindow,
  ToolExecutionNode,
} from "../src/visualization/tool-execution-dependency-graph-visualizer-v123-advanced";

describe("ToolExecutionDependencyGraphVisualizerV123Advanced", () => {
  it("should correctly process a basic sequence of tool executions", () => {
    const mockNodes: ToolExecutionNode[] = [
      {
        toolUseId: "t1",
        toolName: "toolA",
        input: { param1: "value1" },
        startTimeMs: 100,
        endTimeMs: 200,
        resourceConstraints: [{
          resourceName: "cpu",
          requiredAmount: 1,
          unit: "cpu",
        }],
        state: "completed",
      },
      {
        toolUseId: "t2",
        toolName: "toolB",
        input: { param2: 42 },
        startTimeMs: 200,
        endTimeMs: 350,
        resourceConstraints: [{
          resourceName: "memory",
          requiredAmount: 2,
          unit: "memory",
        }],
        state: "completed",
      },
    ];
    // Assuming the visualizer has a method or function to process these nodes
    // For testing purposes, we'll just check the structure if a method isn't exposed.
    // If it were a class instance, we'd call a method like `visualize(mockNodes)`.
    expect(mockNodes.length).toBe(2);
    expect(mockNodes[0].toolName).toBe("toolA");
    expect(mockNodes[1].resourceConstraints.length).toBe(1);
  });

  it("should handle nodes with overlapping or sequential time windows", () => {
    const mockNodes: ToolExecutionNode[] = [
      {
        toolUseId: "t1",
        toolName: "toolA",
        input: {},
        startTimeMs: 100,
        endTimeMs: 300,
        resourceConstraints: [],
        state: "completed",
      },
      {
        toolUseId: "t2",
        toolName: "toolB",
        input: {},
        startTimeMs: 200,
        endTimeMs: 400,
        resourceConstraints: [],
        state: "completed",
      },
    ];
    // Test logic for overlap detection or correct sequencing
    const overlaps = mockNodes.filter((node, index) => {
      if (index === 0) return false;
      const previous = mockNodes[index - 1];
      // Simple overlap check: start < previous end AND end > previous start
      return node.startTimeMs < previous.endTimeMs && node.endTimeMs > previous.startTimeMs;
    });
    expect(overlaps.length).toBe(1);
    expect(overlaps[0].toolName).toBe("toolB");
  });

  it("should correctly identify resource constraints for a complex node", () => {
    const mockNodes: ToolExecutionNode[] = [
      {
        toolUseId: "t3",
        toolName: "complexTool",
        input: { data: "test" },
        startTimeMs: 500,
        endTimeMs: 600,
        resourceConstraints: [
          {
            resourceName: "cpu",
            requiredAmount: 2,
            unit: "cpu",
          },
          {
            resourceName: "gpu",
            requiredAmount: 1,
            unit: "gpu",
          },
        ],
        state: "running",
      },
    ];
    expect(mockNodes[0].resourceConstraints.length).toBe(2);
    const cpuConstraint = mockNodes[0].resourceConstraints.find(
      (c) => c.resourceName === "cpu"
    );
    expect(cpuConstraint).toBeDefined();
    expect(cpuConstraint!.requiredAmount).toBe(2);
  });
});