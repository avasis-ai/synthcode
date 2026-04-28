import { describe, it, expect } from "vitest";
import {
  ContextualDependencyGraphVisualizerV142,
  DependencyNode,
  ResourceUsage,
  TemporalConstraint,
} from "../src/visualization/contextual-dependency-graph-visualizer-v142";

describe("ContextualDependencyGraphVisualizerV142", () => {
  it("should initialize correctly with empty data", () => {
    const visualizer = new ContextualDependencyGraphVisualizerV142();
    expect(visualizer).toBeDefined();
    expect(typeof visualizer.getNodes).toBe("function");
    expect(typeof visualizer.getEdges).toBe("function");
  });

  it("should process and return nodes and edges from sample data", () => {
    const nodes: DependencyNode[] = [
      { id: "A", label: "Node A", position: { x: 10, y: 10 } },
      { id: "B", label: "Node B", position: { x: 50, y: 50 } },
    ];
    const edges = [
      { source: "A", target: "B", weight: 0.8 },
    ];
    const visualizer = new ContextualDependencyGraphVisualizerV142(nodes, edges);

    const nodesResult = visualizer.getNodes();
    const edgesResult = visualizer.getEdges();

    expect(nodesResult).toHaveLength(2);
    expect(edgesResult).toHaveLength(1);
    expect(nodesResult[0].id).toBe("A");
    expect(edgesResult[0].source).toBe("A");
  });

  it("should handle missing nodes or edges gracefully", () => {
    const nodes: DependencyNode[] = [
      { id: "A", label: "Node A", position: { x: 10, y: 10 } },
    ];
    const edges = [
      { source: "A", target: "C", weight: 0.5 }, // Target C is missing
    ];
    const visualizer = new ContextualDependencyGraphVisualizerV142(nodes, edges);

    const edgesResult = visualizer.getEdges();
    // Expecting that the invalid edge is filtered out or handled without crashing
    expect(edgesResult).toHaveLength(0);
  });
});