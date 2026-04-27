import { describe, it, expect } from "vitest";
import { GraphNode, DependencyEdge } from "../src/visualization/dependency-graph-visualizer-v10";

describe("GraphNode", () => {
  it("should correctly initialize a basic node", () => {
    const node: GraphNode = {
      id: "A",
      label: "Start",
      dependencies: [],
    };
    expect(node.id).toBe("A");
    expect(node.label).toBe("Start");
    expect(node.dependencies).toEqual([]);
  });

  it("should handle nodes with optional timing and resource requirements", () => {
    const node: GraphNode = {
      id: "B",
      label: "Process B",
      dependencies: ["A"],
      startTime: 100,
      endTime: 200,
      resourceRequirements: { cpu: 2, memory: 4 },
    };
    expect(node.startTime).toBe(100);
    expect(node.endTime).toBe(200);
    expect(node.resourceRequirements).toEqual({ cpu: 2, memory: 4 });
  });
});

describe("DependencyEdge", () => {
  it("should correctly initialize a basic edge", () => {
    const edge: DependencyEdge = {
      from: "A",
      to: "B",
      weight: 1.0,
    };
    expect(edge.from).toBe("A");
    expect(edge.to).toBe("B");
    expect(edge.weight).toBe(1.0);
  });

  it("should handle edges with temporal constraints", () => {
    const edge: DependencyEdge = {
      from: "A",
      to: "C",
      weight: 0.5,
      temporal: {
        startTime: 50,
        endTime: 150,
      },
    };
    expect(edge.temporal).toBeDefined();
    expect(edge.temporal!.startTime).toBe(50);
    expect(edge.temporal!.endTime).toBe(150);
  });

  it("should handle edges with resource constraints", () => {
    const edge: DependencyEdge = {
      from: "D",
      to: "E",
      weight: 2.0,
      constraints: {
        resource: "network",
        minCapacity: 10,
      },
    };
    expect(edge.constraints).toBeDefined();
    expect(edge.constraints!.resource).toBe("network");
  });
});