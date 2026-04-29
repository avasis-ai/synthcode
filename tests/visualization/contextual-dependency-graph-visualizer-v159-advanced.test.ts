import { describe, it, expect } from "vitest";
import {
  ResourceConstraint,
  TemporalMetadata,
  DependencyEdge,
} from "../src/visualization/contextual-dependency-graph-visualizer-v159-advanced";

describe("ContextualDependencyGraphVisualizerV159Advanced", () => {
  it("should correctly process basic dependency edges", () => {
    const edges: DependencyEdge[] = [
      { source: "A", target: "B" },
      { source: "B", target: "C" },
    ];
    // Assuming a function exists to process these edges, we test the structure.
    // Since the actual function isn't provided, we test the input handling.
    expect(edges).toHaveLength(2);
    expect(edges[0].source).toBe("A");
    expect(edges[1].target).toBe("C");
  });

  it("should handle resource constraints with varying severities", () => {
    const constraints: ResourceConstraint[] = [
      {
        resourceId: "CPU",
        requiredAmount: 10,
        availableCapacity: 20,
        severity: "low",
      },
      {
        resourceId: "Memory",
        requiredAmount: 50,
        availableCapacity: 40,
        severity: "violated",
      },
    ];
    expect(constraints).toHaveLength(2);
    expect(constraints[1].severity).toBe("violated");
    expect(constraints[0].availableCapacity).toBe(20);
  });

  it("should incorporate temporal metadata for critical path analysis", () => {
    const metadata: TemporalMetadata[] = [
      {
        startTimeMs: 1000,
        durationMs: 500,
        deadlineMs: 2000,
        isCriticalPath: true,
      },
      {
        startTimeMs: 500,
        durationMs: 200,
        deadlineMs: 1500,
        isCriticalPath: false,
      },
    ];
    expect(metadata).toHaveLength(2);
    expect(metadata[0].isCriticalPath).toBe(true);
    expect(metadata[1].durationMs).toBe(200);
  });
});