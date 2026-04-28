import { describe, it, expect } from "vitest";
import {
  ContextualDependencyGraphVisualizer,
  StandardEdge,
  ContextualEdge,
} from "../src/visualization/contextual-dependency-graph-visualizer-v143";

describe("ContextualDependencyGraphVisualizer", () => {
  it("should correctly initialize with empty data", () => {
    const visualizer = new ContextualDependencyGraphVisualizer();
    expect(visualizer.getEdges()).toEqual([]);
    expect(visualizer.getNodes()).toEqual([]);
  });

  it("should add standard edges correctly", () => {
    const visualizer = new ContextualDependencyGraphVisualizer();
    const standardEdge: StandardEdge = {
      source: "A",
      target: "B",
      type: "call",
    };
    visualizer.addStandardEdge(standardEdge);
    const edges = visualizer.getEdges();
    expect(edges).toHaveLength(1);
    expect(edges[0]).toEqual(standardEdge);
  });

  it("should add contextual edges with correct properties", () => {
    const visualizer = new ContextualDependencyGraphVisualizer();
    const contextualEdge: ContextualEdge = {
      source: "User",
      target: "Model",
      relevanceScore: 0.9,
      contextualType: "semantic_flow",
    };
    visualizer.addContextualEdge(contextualEdge);
    const edges = visualizer.getEdges();
    expect(edges).toHaveLength(1);
    expect(edges[0]).toEqual(contextualEdge);
  });
});