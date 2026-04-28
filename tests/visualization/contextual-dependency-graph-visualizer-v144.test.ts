import { describe, it, expect } from "vitest";
import {
  ContextualDependencyGraphVisualizer,
  TemporalConstraintEdge,
  GraphNode,
} from "../src/visualization/contextual-dependency-graph-visualizer-v144";

describe("ContextualDependencyGraphVisualizer", () => {
  it("should correctly initialize with basic nodes and edges", () => {
    const nodes: GraphNode[] = [
      { id: "n1", type: "message" },
      { id: "n2", type: "tool_call" },
    ];
    const edges: TemporalConstraintEdge[] = [
      {
        sourceId: "n1",
        targetId: "n2",
        resource: "time",
        minTimeMs: 100,
        maxTimeMs: 500,
        violationSeverity: "low",
      },
    ];
    const visualizer = new ContextualDependencyGraphVisualizer(nodes, edges);

    expect(visualizer.getNodes()).toHaveLength(2);
    expect(visualizer.getEdges()).toHaveLength(1);
    expect(visualizer.getNodes()).toEqual(expect.arrayContaining([
      { id: "n1", type: "message" },
      { id: "n2", type: "tool_call" },
    ]));
  });

  it("should handle empty inputs gracefully", () => {
    const visualizer = new ContextualDependencyGraphVisualizer([], []);
    expect(visualizer.getNodes()).toEqual([]);
    expect(visualizer.getEdges()).toEqual([]);
  });

  it("should correctly process nodes and edges when provided", () => {
    const nodes: GraphNode[] = [
      { id: "start", type: "message" },
      { id: "end", type: "message" },
    ];
    const edges: TemporalConstraintEdge[] = [
      {
        sourceId: "start",
        targetId: "end",
        resource: "time",
        minTimeMs: 0,
        maxTimeMs: 1000,
        violationSeverity: "medium",
      },
    ];
    const visualizer = new ContextualDependencyGraphVisualizer(nodes, edges);

    expect(visualizer.getNodes()).toHaveLength(2);
    expect(visualizer.getEdges()).toHaveLength(1);
    expect(visualizer.getEdges()[0].sourceId).toBe("start");
  });
});