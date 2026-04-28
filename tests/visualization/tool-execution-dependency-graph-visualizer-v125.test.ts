import { describe, it, expect } from "vitest";
import {
  GraphNode,
  Message,
  ResourceMetadata,
  TemporalMetadata,
} from "../src/visualization/tool-execution-dependency-graph-visualizer-v125";

describe("GraphNode", () => {
  it("should correctly initialize a GraphNode with all required properties", () => {
    const node: GraphNode = {
      id: "node-1",
      label: "Tool Execution A",
      metadata: {
        temporal: {
          startTimeMs: 1000,
          endTimeMs: 2000,
          durationMs: 1000,
        },
        resources: [
          { resourceName: "CPU", usageAmount: 0.5, unit: "cores" },
          { resourceName: "Memory", usageAmount: 1024, unit: "MB" },
        ],
      },
    };
    expect(node.id).toBe("node-1");
    expect(node.label).toBe("Tool Execution A");
    expect(node.metadata.temporal.startTimeMs).toBe(1000);
    expect(node.metadata.resources).toHaveLength(2);
  });

  it("should handle nodes with minimal resource usage", () => {
    const node: GraphNode = {
      id: "node-2",
      label: "Simple Step",
      metadata: {
        temporal: {
          startTimeMs: 500,
          endTimeMs: 500,
          durationMs: 0,
        },
        resources: [],
      },
    };
    expect(node.metadata.resources).toEqual([]);
    expect(node.metadata.temporal.durationMs).toBe(0);
  });

  it("should correctly structure the metadata for a node", () => {
    const node: GraphNode = {
      id: "node-3",
      label: "Complex Process",
      metadata: {
        temporal: {
          startTimeMs: 0,
          endTimeMs: 100,
          durationMs: 100,
        },
        resources: [
          { resourceName: "GPU", usageAmount: 1.0, unit: "unit" },
        ],
      },
    };
    expect(node.metadata).toBeDefined();
    expect(node.metadata!.temporal).toBeDefined();
    expect(node.metadata!.resources).toBeDefined();
  });
});