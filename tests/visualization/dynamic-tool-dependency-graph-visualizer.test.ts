import { describe, it, expect } from "vitest";
import {
  DynamicToolDependencyGraphVisualizer,
  GraphData,
} from "../src/visualization/dynamic-tool-dependency-graph-visualizer";

describe("DynamicToolDependencyGraphVisualizer", () => {
  it("should initialize with empty graph data correctly", () => {
    const visualizer = new DynamicToolDependencyGraphVisualizer();
    expect(visualizer.graphData).toEqual({
      nodes: [],
      edges: [],
    });
  });

  it("should update graph data when provided with valid graph data", () => {
    const mockGraphData: GraphData = {
      nodes: [
        { id: "toolA", label: "Tool A", position: { x: 10, y: 10 } },
        { id: "toolB", label: "Tool B", position: { x: 50, y: 50 } },
      ],
      edges: [
        { source: "toolA", target: "toolB", weight: 0.8 },
      ],
    };
    const visualizer = new DynamicToolDependencyGraphVisualizer();
    visualizer.updateGraphData(mockGraphData);
    expect(visualizer.graphData).toEqual(mockGraphData);
  });

  it("should handle updating graph data with empty arrays gracefully", () => {
    const visualizer = new DynamicToolDependencyGraphVisualizer();
    const emptyGraphData: GraphData = {
      nodes: [],
      edges: [],
    };
    visualizer.updateGraphData(emptyGraphData);
    expect(visualizer.graphData).toEqual(emptyGraphData);
  });
});