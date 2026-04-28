import { describe, it, expect } from "vitest";
import {
  GraphNode,
  ResourceConstraint,
  TemporalMetadata,
} from "../src/visualization/tool-execution-dependency-graph-visualizer-v117";

describe("GraphNode", () => {
  it("should correctly structure a basic message node", () => {
    const node: GraphNode = {
      messageId: "msg123",
      type: "message",
      metadata: {
        temporal: {
          startTimeMs: 1000,
          endTimeMs: 2000,
          durationMs: 1000,
        },
        resources: [
          {
            resourceName: "cpu",
            requiredAmount: 1,
            unit: "core",
          },
        ],
      },
    };
    expect(node.messageId).toBe("msg123");
    expect(node.type).toBe("message");
    expect(node.metadata.temporal.durationMs).toBe(1000);
    expect(node.metadata.resources).toHaveLength(1);
  });

  it("should handle nodes with no resource constraints", () => {
    const node: GraphNode = {
      messageId: "msg456",
      type: "message",
      metadata: {
        temporal: {
          startTimeMs: 500,
          endTimeMs: 1500,
          durationMs: 1000,
        },
        resources: [],
      },
    };
    expect(node.messageId).toBe("msg456");
    expect(node.metadata.resources).toHaveLength(0);
  });

  it("should correctly represent temporal metadata", () => {
    const startTime = 1672531200000;
    const endTime = 1672531300000;
    const node: GraphNode = {
      messageId: "msg789",
      type: "message",
      metadata: {
        temporal: {
          startTimeMs: startTime,
          endTimeMs: endTime,
          durationMs: 10000,
        },
        resources: [],
      },
    };
    expect(node.metadata.temporal.startTimeMs).toBe(startTime);
    expect(node.metadata.temporal.endTimeMs).toBe(endTime);
    expect(node.metadata.temporal.durationMs).toBe(10000);
  });
});