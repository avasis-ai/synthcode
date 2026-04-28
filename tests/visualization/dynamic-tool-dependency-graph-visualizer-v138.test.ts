import { describe, it, expect } from "vitest";
import {
  GraphNode,
  GraphEdge,
  NodeId,
  EdgeId,
} from "../src/visualization/dynamic-tool-dependency-graph-visualizer-v138";

describe("Graph structure interfaces", () => {
  it("should correctly define GraphNode structure", () => {
    const node: GraphNode = {
      id: "node1",
      label: "Tool A",
      type: "tool",
      metadata: { version: "1.0" },
    };
    expect(node.id).toBe("node1");
    expect(node.label).toBe("Tool A");
    expect(["tool", "step", "data"]).toContain(node.type);
    expect(typeof node.metadata).toBe("object");
  });

  it("should correctly define GraphEdge structure", () => {
    const edge: GraphEdge = {
      id: "edge1",
      source: "node1",
      target: "node2",
      type: "dependency",
      metadata: { weight: 0.8 },
    };
    expect(edge.id).toBe("edge1");
    expect(edge.source).toBe("node1");
    expect(edge.target).toBe("node2");
    expect(["dependency", "flow"]).toContain(edge.type);
    expect(typeof edge.metadata).toBe("object");
  });

  it("should allow for basic graph construction", () => {
    const nodes: GraphNode[] = [
      { id: "n1", label: "Start", type: "step", metadata: {} },
      { id: "n2", label: "End", type: "data", metadata: {} },
    ];
    const edges: GraphEdge[] = [
      { id: "e1", source: "n1", target: "n2", type: "flow", metadata: {} },
    ];
    expect(nodes.length).toBe(2);
    expect(edges.length).toBe(1);
    expect(nodes[0].type).toBe("step");
    expect(edges[0].source).toBe("n1");
  });
});