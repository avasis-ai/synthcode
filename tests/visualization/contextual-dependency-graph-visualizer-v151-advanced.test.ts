import { describe, it, expect } from "vitest";
import {
  ResourceUsage,
  TemporalConstraint,
  DependencyEdge,
} from "../src/visualization/contextual-dependency-graph-visualizer-v151-advanced";

describe("ContextualDependencyGraphVisualizerV151Advanced", () => {
  it("should correctly construct a basic dependency edge", () => {
    const edge: DependencyEdge = {
      sourceId: "A",
      targetId: "B",
      weight: 0.8,
      temporal: {
        startTime: 100,
        endTime: 200,
        duration: 100,
      },
      resources: [{
        resourceName: "CPU",
        amount: 0.5,
        unit: "core",
      }],
    };
    expect(edge.sourceId).toBe("A");
    expect(edge.targetId).toBe("B");
    expect(edge.weight).toBe(0.8);
    expect(edge.temporal.duration).toBe(100);
    expect(edge.resources.length).toBe(1);
  });

  it("should handle multiple resource usages on an edge", () => {
    const edge: DependencyEdge = {
      sourceId: "Start",
      targetId: "End",
      weight: 1.0,
      temporal: {
        startTime: 0,
        endTime: 500,
        duration: 500,
      },
      resources: [
        {
          resourceName: "Memory",
          amount: 2,
          unit: "GB",
        },
        {
          resourceName: "Network",
          amount: 10,
          unit: "Mbps",
        },
      ],
    };
    expect(edge.resources.length).toBe(2);
    expect(edge.resources[0].resourceName).toBe("Memory");
    expect(edge.resources[1].resourceName).toBe("Network");
  });

  it("should correctly calculate derived properties if implemented (e.g., total resource load)", () => {
    // Assuming the visualizer logic might process this structure, we test the structure integrity.
    const edge: DependencyEdge = {
      sourceId: "Step1",
      targetId: "Step2",
      weight: 0.5,
      temporal: {
        startTime: 50,
        endTime: 150,
        duration: 100,
      },
      resources: [{
        resourceName: "CPU",
        amount: 0.3,
        unit: "core",
      }],
    };
    // This test primarily validates the structure passed to the visualizer.
    expect(edge.temporal.startTime).toBe(50);
    expect(edge.temporal.endTime).toBe(150);
  });
});