import { describe, it, expect } from "vitest";
import {
  AdvancedEdge,
  TemporalConstraint,
  ResourceConstraint,
} from "../src/visualization/contextual-tool-call-dependency-graph-visualizer-v152-advanced-advanced";

describe("AdvancedEdge", () => {
  it("should correctly construct a basic CALL dependency edge", () => {
    const edge: AdvancedEdge = {
      sourceId: "A",
      targetId: "B",
      dependencyType: "CALL",
      constraints: {
        temporal: {
          startTimeMs: 100,
          endTimeMs: 200,
        },
      },
    };
    expect(edge.sourceId).toBe("A");
    expect(edge.targetId).toBe("B");
    expect(edge.dependencyType).toBe("CALL");
    expect(edge.constraints).toHaveProperty("temporal");
  });

  it("should correctly construct a DATA_FLOW dependency edge with resource constraints", () => {
    const edge: AdvancedEdge = {
      sourceId: "ToolA",
      targetId: "ToolB",
      dependencyType: "DATA_FLOW",
      constraints: {
        resource: [
          { resourceId: "data_cache", requiredCapacity: 5 },
        ],
      },
    };
    expect(edge.sourceId).toBe("ToolA");
    expect(edge.targetId).toBe("ToolB");
    expect(edge.dependencyType).toBe("DATA_FLOW");
    expect(edge.constraints).toHaveProperty("resource");
    expect((edge.constraints.resource as any[]).length).toBe(1);
  });

  it("should correctly construct a TEMPORAL_DEPENDENCY edge with both temporal and resource constraints", () => {
    const edge: AdvancedEdge = {
      sourceId: "Step1",
      targetId: "Step2",
      dependencyType: "TEMPORAL_DEPENDENCY",
      constraints: {
        temporal: {
          startTimeMs: 500,
          endTimeMs: 1500,
        },
        resource: [
          { resourceId: "network", requiredCapacity: 1 },
        ],
      },
    };
    expect(edge.sourceId).toBe("Step1");
    expect(edge.targetId).toBe("Step2");
    expect(edge.dependencyType).toBe("TEMPORAL_DEPENDENCY");
    expect(edge.constraints).toHaveProperty("temporal");
    expect(edge.constraints).toHaveProperty("resource");
  });
});