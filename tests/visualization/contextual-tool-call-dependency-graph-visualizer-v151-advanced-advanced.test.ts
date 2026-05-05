import { describe, it, expect } from "vitest";
import {
  DependencyGraphVisualizer,
  ToolCallContext,
  DependencyEdge,
} from "../src/visualization/contextual-tool-call-dependency-graph-visualizer-v151-advanced-advanced";

describe("DependencyGraphVisualizer", () => {
  it("should correctly initialize with empty data", () => {
    const visualizer = new DependencyGraphVisualizer([]);
    expect(visualizer.getNodes()).toEqual([]);
    expect(visualizer.getEdges()).toEqual([]);
  });

  it("should add nodes and edges correctly from a basic set of data", () => {
    const nodes: any[] = [{ id: "A", label: "Node A" }];
    const edges: any[] = [{ source_id: "A", target_id: "B", dependency_type: "contextual", weight: 1.0 }];
    const visualizer = new DependencyGraphVisualizer(nodes, edges);

    expect(visualizer.getNodes()).toHaveLength(1);
    expect(visualizer.getEdges()).toHaveLength(1);
    expect(visualizer.getNodes()[0].id).toBe("A");
    expect(visualizer.getEdges()[0].source_id).toBe("A");
  });

  it("should handle multiple types of dependencies", () => {
    const nodes: any[] = [{ id: "T1", label: "Tool 1" }, { id: "T2", label: "Tool 2" }];
    const edges: any[] = [
      { source_id: "T1", target_id: "T2", dependency_type: "contextual", weight: 0.8 },
      { source_id: "T1", target_id: "T1", dependency_type: "resource", weight: 1.0 },
      { source_id: "T2", target_id: "T1", dependency_type: "temporal", weight: 0.5 },
    ];
    const visualizer = new DependencyGraphVisualizer(nodes, edges);

    expect(visualizer.getNodes()).toHaveLength(2);
    expect(visualizer.getEdges()).toHaveLength(3);
    const edgeTypes = visualizer.getEdges().map(e => e.dependency_type);
    expect(edgeTypes).toContain("contextual");
    expect(edgeTypes).toContain("resource");
    expect(edgeTypes).toContain("temporal");
  });
});