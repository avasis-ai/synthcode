import { describe, it, expect } from "vitest";
import {
  GraphNode,
  ResourceConstraint,
  TemporalMetadata,
} from "../src/visualization/tool-execution-dependency-graph-visualizer-v133-advanced";

describe("GraphNode", () => {
  it("should correctly initialize a basic node", () => {
    const node: GraphNode = { id: "node1", label: "Test Node" };
    expect(node.id).toBe("node1");
    expect(node.label).toBe("Test Node");
    expect(node.resourceConstraints).toBeUndefined();
    expect(node.temporalMetadata).toBeUndefined();
  });

  it("should correctly initialize a node with resource constraints", () => {
    const constraints: ResourceConstraint = {
      cpuUsage: 0.5,
      memoryUsage: 1024,
    };
    const node: GraphNode = { id: "node2", label: "Resource Node", resourceConstraints: constraints };
    expect(node.resourceConstraints).toEqual(constraints);
    expect(node.id).toBe("node2");
  });

  it("should correctly initialize a node with temporal metadata", () => {
    const metadata: TemporalMetadata = {
      startTime: 1678886400,
      endTime: 1678886500,
    };
    const node: GraphNode = { id: "node3", label: "Time Node", temporalMetadata: metadata };
    expect(node.temporalMetadata).toEqual(metadata);
    expect(node.label).toBe("Time Node");
  });
});