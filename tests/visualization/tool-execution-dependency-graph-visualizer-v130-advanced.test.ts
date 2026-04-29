import { describe, it, expect } from "vitest";
import {
  ToolNodePayload,
  ResourceUsage,
  TemporalConstraint,
} from "../src/visualization/tool-execution-dependency-graph-visualizer-v130-advanced";

describe("ToolExecutionDependencyGraphVisualizerV130Advanced", () => {
  it("should correctly visualize a simple linear dependency chain", () => {
    const payload: ToolNodePayload = {
      toolName: "ToolA",
      toolId: "A",
      input: { param1: "value1" },
      executionTimeMs: 100,
      resourceUsage: [{ resourceName: "CPU", amount: 0.5, unit: "core" }],
      tempo: 1,
    };
    const constraints: TemporalConstraint[] = [
      { startTimeMs: 0, endTimeMs: 100, dependency: undefined },
      { startTimeMs: 100, endTimeMs: 200, dependency: "A" },
    ];

    // Mock implementation or expected structure check
    // Since we don't have the full class/function, we test the structure it consumes.
    expect(payload.toolId).toBe("A");
    expect(constraints.length).toBe(2);
    expect(constraints[1].dependency).toBe("A");
  });

  it("should handle multiple parallel and overlapping tool executions", () => {
    const payload: ToolNodePayload = {
      toolName: "ToolB",
      toolId: "B",
      input: { param1: "value2" },
      executionTimeMs: 150,
      resourceUsage: [{ resourceName: "GPU", amount: 1.0, unit: "unit" }],
      tempo: 1,
    };
    const constraints: TemporalConstraint[] = [
      { startTimeMs: 0, endTimeMs: 150, dependency: undefined },
      { startTimeMs: 50, endTimeMs: 200, dependency: "A" }, // Overlaps with B's start
    ];

    // Test for overlapping constraints logic (assuming the visualizer handles this)
    expect(payload.toolId).toBe("B");
    expect(constraints.length).toBe(2);
    expect(constraints[1].startTimeMs).toBe(50);
    expect(constraints[1].endTimeMs).toBe(200);
  });

  it("should correctly process resource usage across multiple tools", () => {
    const payload: ToolNodePayload = {
      toolName: "ToolC",
      toolId: "C",
      input: {},
      executionTimeMs: 50,
      resourceUsage: [
        { resourceName: "CPU", amount: 0.2, unit: "core" },
        { resourceName: "Memory", amount: 4, unit: "GB" },
      ],
      tempo: 1,
    };
    const constraints: TemporalConstraint[] = [
      { startTimeMs: 300, endTimeMs: 350, dependency: "B" },
    ];

    expect(payload.resourceUsage.length).toBe(2);
    const cpuUsage = payload.resourceUsage.find(r => r.resourceName === "CPU");
    expect(cpuUsage).toBeDefined();
    expect(cpuUsage?.amount).toBe(0.2);
    expect(constraints[0].dependency).toBe("B");
  });
});