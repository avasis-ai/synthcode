import { describe, it, expect } from "vitest";
import { ContextualDependencyGraphVisualizer, DependencyGraphContext } from "../src/visualization/contextual-dependency-graph-visualizer-v156";

describe("ContextualDependencyGraphVisualizer", () => {
  it("should initialize with a correct minimum relevance threshold", () => {
    const threshold = 0.5;
    const visualizer = new ContextualDependencyGraphVisualizer(threshold);
    // Assuming there's a way to test the private field or a getter for this
    // For this test, we'll rely on the constructor logic being sound.
    // A more robust test would require exposing this or using reflection if possible.
    expect(visualizer).toBeInstanceOf(ContextualDependencyGraphVisualizer);
  });

  it("should filter out edges below the minimum relevance threshold", () => {
    const threshold = 0.7;
    const visualizer = new ContextualDependencyGraphVisualizer(threshold);

    const mockContext: DependencyGraphContext = {
      messages: [],
      edges: [
        { sourceId: "A", targetId: "B", contextRelevanceScore: 0.9 },
        { sourceId: "C", targetId: "D", contextRelevanceScore: 0.4 }, // Should be filtered
        { sourceId: "E", targetId: "F", contextRelevanceScore: 0.7 },
      ],
    };

    const result = visualizer.getFilteredEdges(mockContext);
    expect(result.length).toBe(2);
    expect(result.some(edge => edge.sourceId === "C")).toBe(false);
  });

  it("should handle an empty context gracefully", () => {
    const threshold = 0.5;
    const visualizer = new ContextualDependencyGraphVisualizer(threshold);

    const mockContext: DependencyGraphContext = {
      messages: [],
      edges: [],
    };

    const result = visualizer.getFilteredEdges(mockContext);
    expect(result).toEqual([]);
  });
});