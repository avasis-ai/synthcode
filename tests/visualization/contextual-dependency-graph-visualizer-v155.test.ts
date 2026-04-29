import { describe, it, expect } from "vitest";
import {
  ContextualEdgePayload,
  DependencyEdge,
} from "../src/visualization/contextual-dependency-graph-visualizer-v155";

describe("ContextualDependencyGraphVisualizerV155", () => {
  it("should correctly construct a basic dependency edge", () => {
    const edge: DependencyEdge = {
      sourceId: "A",
      targetId: "B",
      payload: {
        type: "RESOURCE_CONSTRAINT",
        description: "A requires resource from B",
        severity: "HIGH",
      },
    };
    expect(edge.sourceId).toBe("A");
    expect(edge.targetId).toBe("B");
    expect(edge.payload.type).toBe("RESOURCE_CONSTRAINT");
    expect(edge.payload.severity).toBe("HIGH");
  });

  it("should handle different contextual metadata types", () => {
    const edge: DependencyEdge = {
      sourceId: "C",
      targetId: "D",
      payload: {
        type: "GOAL_ALIGNMENT",
        description: "C supports the goal of D",
        severity: "LOW",
      },
    };
    expect(edge.payload.type).toBe("GOAL_ALIGNMENT");
    expect(edge.payload.description).toBe("C supports the goal of D");
  });

  it("should validate edge structure with semantic link", () => {
    const edge: DependencyEdge = {
      sourceId: "E",
      targetId: "F",
      payload: {
        type: "SEMANTIC_LINK",
        description: "E is semantically related to F",
        severity: "MEDIUM",
      },
    };
    expect(edge).toBeDefined();
    expect(typeof edge.sourceId).toBe("string");
    expect(typeof edge.payload.description).toBe("string");
  });
});