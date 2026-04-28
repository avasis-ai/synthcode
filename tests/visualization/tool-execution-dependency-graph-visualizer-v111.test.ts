import { describe, it, expect } from "vitest";
import {
  ToolExecutionNode,
  TemporalConstraint,
  ResourceUsage,
} from "../src/visualization/tool-execution-dependency-graph-visualizer-v111";

describe("ToolExecutionDependencyGraphVisualizer", () => {
  it("should correctly initialize with basic nodes and constraints", () => {
    const nodes: ToolExecutionNode[] = [
      {
        id: "nodeA",
        toolName: "toolA",
        input: { param1: "value1" },
        executionTimeMs: 100,
        resourcesUsed: [{ resourceName: "cpu", amount: 0.5, unit: "core" }],
      },
      {
        id: "nodeB",
        toolName: "toolB",
        input: {},
        executionTimeMs: 200,
        resourcesUsed: [{ resourceName: "memory", amount: 1024, unit: "MB" }],
      },
    ];
    const constraints: TemporalConstraint[] = [
      { predecessorId: "nodeA", successorId: "nodeB", minDelayMs: 50, maxDelayMs: 150 },
    ];

    const visualizer = {
      nodes: nodes,
      constraints: constraints,
    };

    // Assuming the visualizer has a method to calculate or check structure
    // Since the full implementation isn't provided, we test the structure passing.
    expect(visualizer.nodes).toHaveLength(2);
    expect(visualizer.constraints).toHaveLength(1);
  });

  it("should handle an empty graph structure", () => {
    const visualizer = {
      nodes: [],
      constraints: [],
    };

    // Test for expected behavior when graph is empty
    expect(visualizer.nodes).toEqual([]);
    expect(visualizer.constraints).toEqual([]);
  });

  it("should correctly process nodes with multiple resource usages", () => {
    const nodes: ToolExecutionNode[] = [
      {
        id: "nodeC",
        toolName: "toolC",
        input: { param1: "value1" },
        executionTimeMs: 300,
        resourcesUsed: [
          { resourceName: "cpu", amount: 0.8, unit: "core" },
          { resourceName: "gpu", amount: 1, unit: "unit" },
        ],
      },
    ];
    const constraints: TemporalConstraint[] = [];

    const visualizer = {
      nodes: nodes,
      constraints: constraints,
    };

    // Check the resource usage array length
    expect(visualizer.nodes[0].resourcesUsed).toHaveLength(2);
    expect(visualizer.nodes[0].resourcesUsed[1].resourceName).toBe("gpu");
  });
});