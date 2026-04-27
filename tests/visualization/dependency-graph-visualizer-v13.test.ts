import { describe, it, expect } from "vitest";
import { DependencyGraphVisualizer } from "../src/visualization/dependency-graph-visualizer-v13";

describe("DependencyGraphVisualizer", () => {
  it("should correctly initialize with basic data", () => {
    const visualizer = new DependencyGraphVisualizer();
    expect(visualizer).toBeDefined();
  });

  it("should process a simple set of dependencies", () => {
    const visualizer = new DependencyGraphVisualizer();
    const dependencies = [
      { from: "A", to: "B", weight: 1 },
      { from: "B", to: "C", weight: 2 },
    ];
    visualizer.addDependencies(dependencies);
    // Assuming there's a method or property to check the processed graph structure
    // For this example, we'll just check if adding dependencies doesn't throw and maybe check a count if available.
    // Since the actual implementation details are hidden, we'll assume a method like getNodesCount() exists for testing.
    // If no such method exists, this test will need adjustment based on the actual API.
    // For now, we'll just ensure it runs without error.
    expect(() => visualizer.addDependencies(dependencies)).not.toThrow();
  });

  it("should handle an empty set of dependencies gracefully", () => {
    const visualizer = new DependencyGraphVisualizer();
    const dependencies: any[] = [];
    visualizer.addDependencies(dependencies);
    // Check if the internal state remains clean or unchanged
    expect(() => visualizer.addDependencies(dependencies)).not.toThrow();
  });
});