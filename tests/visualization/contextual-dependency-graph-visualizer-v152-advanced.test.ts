import { describe, it, expect } from "vitest";
import {
  AdvancedEdge,
  TemporalConstraint,
  ResourceConstraint,
} from "../src/visualization/contextual-dependency-graph-visualizer-v152-advanced";

describe("AdvancedEdge", () => {
  it("should correctly create an edge with only source and target", () => {
    const edge: AdvancedEdge = { source: "A", target: "B", metadata: {} };
    expect(edge.source).toBe("A");
    expect(edge.target).toBe("B");
    expect(edge.metadata).toEqual({});
  });

  it("should correctly include temporal constraints in metadata", () => {
    const temporalConstraint: TemporalConstraint = {
      startTime: 100,
      endTime: 200,
    };
    const edge: AdvancedEdge = {
      source: "A",
      target: "B",
      metadata: { temporal: temporalConstraint },
    };
    expect(edge.metadata).toHaveProperty("temporal", temporalConstraint);
    expect(edge.metadata).not.toHaveProperty("resource");
  });

  it("should correctly include resource constraints in metadata", () => {
    const resourceConstraint: ResourceConstraint = {
      resourceId: "CPU",
      capacityUsed: 50,
    };
    const edge: AdvancedEdge = {
      source: "A",
      target: "B",
      metadata: { resource: resourceConstraint },
    };
    expect(edge.metadata).toHaveProperty("resource", resourceConstraint);
    expect(edge.metadata).not.toHaveProperty("temporal");
  });
});