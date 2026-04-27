import { describe, it, expect } from "vitest";
import {
  ToolExecutionNode,
  ResourceConstraint,
  TemporalMetadata,
} from "../src/visualization/tool-execution-dependency-graph-visualizer-v102";

describe("ToolExecutionNode", () => {
  it("should correctly construct a basic ToolExecutionNode", () => {
    const node: ToolExecutionNode = {
      id: "tool-1",
      name: "fetch_user_data",
      metadata: {
        temporal: { startTimeMs: 1000, endTimeMs: 2000 },
        resources: [
          { resourceName: "network", requiredAmount: 1, unit: "call" },
        ],
      },
    };
    expect(node.id).toBe("tool-1");
    expect(node.name).toBe("fetch_user_data");
    expect(node.metadata.temporal.startTimeMs).toBe(1000);
    expect(node.metadata.resources).toHaveLength(1);
  });

  it("should handle multiple resource constraints", () => {
    const node: ToolExecutionNode = {
      id: "tool-2",
      name: "process_data",
      metadata: {
        temporal: { startTimeMs: 3000, endTimeMs: 5000 },
        resources: [
          { resourceName: "cpu", requiredAmount: 0.5, unit: "core" },
          { resourceName: "memory", requiredAmount: 1024, unit: "MB" },
        ],
      },
    };
    expect(node.metadata.resources).toHaveLength(2);
    expect(node.metadata.resources[0].resourceName).toBe("cpu");
    expect(node.metadata.resources[1].requiredAmount).toBe(1024);
  });

  it("should handle nodes with no explicit resource constraints", () => {
    const node: ToolExecutionNode = {
      id: "tool-3",
      name: "simple_action",
      metadata: {
        temporal: { startTimeMs: 500, endTimeMs: 1000 },
        resources: [],
      },
    };
    expect(node.metadata.resources).toEqual([]);
    expect(node.metadata.temporal.startTimeMs).toBe(500);
  });
});