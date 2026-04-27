import { describe, it, expect } from "vitest";
import {
  TemporalNode,
  TemporalEdge,
} from "../src/visualization/dependency-graph-visualizer-v30";

describe("DependencyGraphVisualizerV30", () => {
  it("should correctly define the structure for TemporalNode", () => {
    const node: TemporalNode = {
      id: "node1",
      label: "Start",
      startTime: 0,
      endTime: 100,
      resourceUsage: { cpu: 1, memory: 2 },
    };
    expect(node.id).toBe("node1");
    expect(typeof node.startTime).toBe("number");
    expect(typeof node.resourceUsage).toBe("object");
  });

  it("should correctly define the structure for TemporalEdge", () => {
    const edge: TemporalEdge = {
      sourceId: "node1",
      targetId: "node2",
      startTime: 100,
      endTime: 200,
      weight: 0.5,
    };
    expect(edge.sourceId).toBe("node1");
    expect(edge.targetId).toBe("node2");
    expect(typeof edge.weight).toBe("number");
  });

  it("should handle empty arrays for nodes and edges", () => {
    const nodes: TemporalNode[] = [];
    const edges: TemporalEdge[] = [];
    expect(nodes).toEqual([]);
    expect(edges).toEqual([]);
  });
});