import { describe, it, expect } from "vitest";
import {
  GraphNode,
  GraphEdge,
} from "../src/visualization/dynamic-tool-dependency-graph-visualizer-v139";

describe("GraphNode and GraphEdge interfaces", () => {
  it("should correctly define a GraphNode structure", () => {
    const node: GraphNode = {
      id: "node1",
      type: "tool",
      label: "Tool A",
      startTime: 100,
      endTime: 200,
      resourceUsage: { cpu: 0.5, memory: 1024 },
    };
    expect(node.id).toBe("node1");
    expect(node.type).toBe("tool");
    expect(node.startTime).toBe(100);
    expect(node.resourceUsage).toEqual({ cpu: 0.5, memory: 1024 });
  });

  it("should correctly define a GraphEdge structure", () => {
    const edge: GraphEdge = {
      sourceId: "node1",
      targetId: "node2",
      dependencyType: "causal",
      weight: 0.8,
    };
    expect(edge.sourceId).toBe("node1");
    expect(edge.targetId).toBe("node2");
    expect(edge.dependencyType).toBe("causal");
    expect(edge.weight).toBe(0.8);
  });

  it("should handle different dependency types for GraphEdge", () => {
    const sequentialEdge: GraphEdge = {
      sourceId: "a",
      targetId: "b",
      dependencyType: "sequential",
      weight: 1.0,
    };
    const resourceEdge: GraphEdge = {
      sourceId: "c",
      targetId: "d",
      dependencyType: "resource_constrained",
      weight: 0.5,
    };
    expect(sequentialEdge.dependencyType).toBe("sequential");
    expect(resourceEdge.dependencyType).toBe("resource_constrained");
  });
});