import { describe, it, expect } from "vitest";
import {
  ResourceUsage,
  TemporalConstraint,
  AdvancedNodeMetadata,
} from "../src/visualization/tool-execution-dependency-graph-visualizer-v133-advanced-advanced";

describe("AdvancedNodeMetadata", () => {
  it("should correctly structure resource usage", () => {
    const resources: ResourceUsage[] = [
      { resourceName: "CPU", usageAmount: 1.5, unit: "cores" },
      { resourceName: "Memory", usageAmount: 4096, unit: "MB" },
    ];
    const metadata: AdvancedNodeMetadata = {
      nodeId: "node-123",
      startTime: 1678886400,
      endTime: 1678886460,
      resourcesUsed: resources,
      constraints: [],
    };
    expect(metadata.nodeId).toBe("node-123");
    expect(metadata.resourcesUsed).toHaveLength(2);
    expect(metadata.resourcesUsed[0].resourceName).toBe("CPU");
  });

  it("should correctly structure temporal constraints", () => {
    const constraints: TemporalConstraint[] = [
      {
        startTime: 1678886400,
        endTime: 1678886430,
        description: "Must run during peak hours",
      },
      {
        startTime: 1678886500,
        endTime: 1678886600,
        description: "Avoid maintenance window",
      },
    ];
    const metadata: AdvancedNodeMetadata = {
      nodeId: "node-456",
      startTime: 1678886400,
      endTime: 1678886600,
      resourcesUsed: [],
      constraints: constraints,
    };
    expect(metadata.constraints).toHaveLength(2);
    expect(metadata.constraints[1].description).toBe("Avoid maintenance window");
  });

  it("should handle empty metadata fields", () => {
    const metadata: AdvancedNodeMetadata = {
      nodeId: "node-empty",
      startTime: 0,
      endTime: 0,
      resourcesUsed: [],
      constraints: [],
    };
    expect(metadata.nodeId).toBe("node-empty");
    expect(metadata.resourcesUsed).toEqual([]);
    expect(metadata.constraints).toEqual([]);
  });
});