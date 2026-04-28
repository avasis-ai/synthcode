import { describe, it, expect } from "vitest";
import { TemporalGraphData } from "../types";
import { visualizeDependencyGraph } from "../tool-execution-dependency-graph-visualizer-v30";

describe("visualizeDependencyGraph", () => {
  it("should return an empty graph data structure for empty input", () => {
    const emptyData: TemporalGraphData = {
      nodes: [],
      edges: [],
    };
    const result = visualizeDependencyGraph(emptyData);
    expect(result).toEqual({
      nodes: [],
      edges: [],
    });
  });

  it("should correctly process a simple linear sequence of nodes and edges", () => {
    const inputData: TemporalGraphData = {
      nodes: [
        { id: "n1", label: "Start", type: "message" },
        { id: "n2", label: "Tool A", type: "tool_call" },
        { id: "n3", label: "End", type: "message" },
      ],
      edges: [
        { source: "n1", target: "n2", type: "dependency" },
        { source: "n2", target: "n3", type: "message_flow" },
      ],
    };
    const result = visualizeDependencyGraph(inputData);
    expect(result.nodes.length).toBe(3);
    expect(result.edges.length).toBe(2);
    expect(result.nodes[0].label).toBe("Start");
    expect(result.edges[0].source).toBe("n1");
  });

  it("should handle nodes and edges with metadata correctly", () => {
    const inputData: TemporalGraphData = {
      nodes: [
        { id: "n1", label: "Start", type: "message", metadata: { source: "user" } },
        { id: "n2", label: "Tool A", type: "tool_call", metadata: { toolName: "A" } },
      ],
      edges: [
        { source: "n1", target: "n2", type: "dependency", metadata: { weight: 1.0 } },
      ],
    };
    const result = visualizeDependencyGraph(inputData);
    expect(result.nodes.length).toBe(2);
    expect(result.edges.length).toBe(1);
    expect(result.nodes[1].metadata).toEqual({ toolName: "A" });
    expect(result.edges[0].metadata).toEqual({ weight: 1.0 });
  });
});