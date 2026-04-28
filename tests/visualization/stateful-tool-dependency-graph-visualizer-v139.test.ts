import { describe, it, expect } from "vitest";
import {
  GraphNode,
  GraphEdge,
} from "../src/visualization/stateful-tool-dependency-graph-visualizer-v139";

describe("GraphNode and GraphEdge interfaces", () => {
  it("should correctly define the GraphNode interface", () => {
    const node: GraphNode = {
      id: "node1",
      type: "message",
      label: "User message",
      metadata: { role: "user" },
      startTime: 100,
      endTime: 200,
    };
    expect(node.id).toBe("node1");
    expect(node.type).toBe("message");
    expect(typeof node.metadata).toBe("object");
  });

  it("should correctly define the GraphEdge interface", () => {
    const edge: GraphEdge = {
      fromId: "node1",
      toId: "node2",
      type: "dependency",
      metadata: { weight: 0.5 },
    };
    expect(edge.fromId).toBe("node1");
    expect(edge.toId).toBe("node2");
    expect(edge.type).toBe("dependency");
    expect(typeof edge.metadata).toBe("object");
  });

  it("should handle different edge types", () => {
    const dependencyEdge: GraphEdge = {
      fromId: "a",
      toId: "b",
      type: "dependency",
      metadata: {},
    };
    const temporalEdge: GraphEdge = {
      fromId: "c",
      toId: "d",
      type: "temporal",
      metadata: {},
    };
    const resourceEdge: GraphEdge = {
      fromId: "e",
      toId: "f",
      type: "resource_flow",
      metadata: {},
    };
    expect(dependencyEdge.type).toBe("dependency");
    expect(temporalEdge.type).toBe("temporal");
    expect(resourceEdge.type).toBe("resource_flow");
  });
});