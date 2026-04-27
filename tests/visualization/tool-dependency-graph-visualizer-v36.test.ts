import { describe, it, expect } from "vitest";
import { DependencyGraphData } from "../src/visualization/tool-dependency-graph-visualizer-v36";

describe("DependencyGraphData structure", () => {
  it("should correctly structure nodes with various types", () => {
    const data: DependencyGraphData = {
      nodes: [
        { id: "start", type: "start", label: "Start", details: {} },
        { id: "toolA", type: "tool", label: "Tool A", details: { name: "toolA" } },
        { id: "context1", type: "context", label: "Context Info", details: { source: "user" } },
        { id: "resourceX", type: "resource", label: "Resource X", details: { type: "file" } },
        { id: "end", type: "end", label: "End", details: {} },
      ],
      edges: [],
    };

    expect(data.nodes).toHaveLength(5);
    expect(data.nodes.some(node => node.type === "start" && node.label === "Start")).toBe(true);
    expect(data.nodes.some(node => node.type === "tool" && node.label === "Tool A")).toBe(true);
  });

  it("should correctly structure edges representing different relationships", () => {
    const data: DependencyGraphData = {
      nodes: [
        { id: "start", type: "start", label: "Start", details: {} },
        { id: "toolA", type: "tool", label: "Tool A", details: {} },
        { id: "end", type: "end", label: "End", details: {} },
      ],
      edges: [
        { fromId: "start", toId: "toolA", type: "calls" },
        { fromId: "toolA", toId: "end", type: "data_flow", weight: 1.5 },
        { fromId: "start", toId: "end", type: "constraint" },
      ],
    };

    expect(data.edges).toHaveLength(3);
    const callsEdge = data.edges.find(e => e.type === "calls");
    expect(callsEdge).toBeDefined();
    expect(callsEdge?.fromId).toBe("start");
    expect(callsEdge?.toId).toBe("toolA");
  });

  it("should handle empty graph data gracefully", () => {
    const data: DependencyGraphData = {
      nodes: [],
      edges: [],
    };

    expect(data.nodes).toEqual([]);
    expect(data.edges).toEqual([]);
  });
});