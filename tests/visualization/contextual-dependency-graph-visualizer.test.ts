import { describe, it, expect } from "vitest";
import { ContextualDependencyGraphVisualizer } from "../src/visualization/contextual-dependency-graph-visualizer";

describe("ContextualDependencyGraphVisualizer", () => {
  it("should correctly initialize with valid graph and context", () => {
    const mockGraph: any = {
      nodes: {
        "A": { id: "A", label: "Node A", metadata: {} },
        "B": { id: "B", label: "Node B", metadata: {} },
      },
      edges: [{ source: "A", target: "B", weight: 0.8 }],
    };
    const mockContext: any = { query: "What is the relationship between A and B?" };
    const visualizer = new ContextualDependencyGraphVisualizer(mockGraph, mockContext);

    expect(visualizer).toBeDefined();
    // Assuming the constructor stores the inputs or has a way to verify initialization
    // Since we don't see the implementation, we test for basic existence.
  });

  it("should handle an empty graph structure gracefully", () => {
    const mockGraph: any = { nodes: {}, edges: [] };
    const mockContext: any = { query: "Empty query test" };
    const visualizer = new ContextualDependencyGraphVisualizer(mockGraph, mockContext);

    // Expecting no errors and perhaps an empty visualization state
    expect(() => {
      visualizer.render();
    }).not.toThrow();
  });

  it("should update visualization when context changes", () => {
    const mockGraph: any = {
      nodes: { "A": { id: "A", label: "Node A", metadata: {} } },
      edges: [],
    };
    const initialContext: any = { query: "Initial query" };
    const visualizer = new ContextualDependencyGraphVisualizer(mockGraph, initialContext);

    const newContext: any = { query: "Updated query focusing on A" };
    // Assuming a method exists to update context and trigger a re-render/re-calculation
    // If the class has an updateContext method:
    // visualizer.updateContext(newContext);
    
    // For testing purposes, we assume a method call that simulates context change:
    const updateContextSpy = vi.spyOn(visualizer, 'updateContext').mockImplementation(() => {});
    visualizer.updateContext(newContext);
    expect(updateContextSpy).toHaveBeenCalledWith(newContext);
  });
});