import { describe, it, expect } from "vitest";
import {
  ResourceUsage,
  TemporalConstraint,
  GraphNodeData,
} from "../src/visualization/tool-execution-dependency-graph-visualizer-v131";

describe("GraphNodeData structure", () => {
  it("should correctly structure a basic node with resource usage", () => {
    const node: GraphNodeData = {
      nodeId: "node1",
      label: "Tool A Execution",
      resourceUsage: {
        cpuUtilization: 0.5,
        memoryUtilization: 0.3,
        durationMs: 1000,
      },
      temporalConstraint: {
        startTimeMs: 1000,
        endTimeMs: 2000,
      },
    };
    expect(node.nodeId).toBe("node1");
    expect(node.label).toBe("Tool A Execution");
    expect(node.resourceUsage.cpuUtilization).toBe(0.5);
    expect(node.temporalConstraint.startTimeMs).toBe(1000);
  });

  it("should handle zero or minimal resource usage", () => {
    const node: GraphNodeData = {
      nodeId: "node2",
      label: "Quick Check",
      resourceUsage: {
        cpuUtilization: 0.0,
        memoryUtilization: 0.0,
        durationMs: 10,
      },
      temporalConstraint: {
        startTimeMs: 0,
        endTimeMs: 10,
      },
    };
    expect(node.resourceUsage.cpuUtilization).toBe(0.0);
    expect(node.resourceUsage.durationMs).toBe(10);
    expect(node.temporalConstraint.startTimeMs).toBe(0);
  });

  it("should correctly represent a node with a wide temporal constraint", () => {
    const node: GraphNodeData = {
      nodeId: "node3",
      label: "Long Running Process",
      resourceUsage: {
        cpuUtilization: 0.9,
        memoryUtilization: 0.8,
        durationMs: 5000,
      },
      temporalConstraint: {
        startTimeMs: 5000,
        endTimeMs: 10000,
      },
    };
    expect(node.nodeId).toBe("node3");
    expect(node.resourceUsage.cpuUtilization).toBe(0.9);
    expect(node.temporalConstraint.endTimeMs).toBe(10000);
  });
});