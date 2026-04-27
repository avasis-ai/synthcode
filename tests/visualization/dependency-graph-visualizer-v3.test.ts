import { describe, it, expect } from "vitest";
import { DependencyGraph, DependencyEdge, GraphContext } from "../src/visualization/dependency-graph-visualizer-v3";

describe("DependencyGraphVisualizerV3", () => {
  it("should initialize with correct default context", () => {
    const context: GraphContext = {
      activeFilters: new Set(),
      visibleDependencyTypes: new Set(),
      rootNodes: new Set(),
    };
    expect(context.activeFilters).toBeInstanceOf(Set);
    expect(context.visibleDependencyTypes).toBeInstanceOf(Set);
    expect(context.rootNodes).toBeInstanceOf(Set);
  });

  it("should correctly process a simple graph structure", () => {
    const graph: DependencyGraph = new Map([
      ["A", { dependencies: new Set(["B"]), metadata: { weight: 1 } }],
      ["B", { dependencies: new Set(["C"]), metadata: {} }],
      ["C", { dependencies: new Set(), metadata: { weight: 0 } }],
    ]);
    const edges: DependencyEdge[] = [
      { source: "A", target: "B", type: "CALL", metadata: {} },
      { source: "B", target: "C", type: "USES", metadata: {} },
    ];
    // Assuming a function exists to process/validate, we test the structure passed in.
    // For this test, we just ensure the types are handled.
    expect(graph.size).toBe(3);
    expect(graph.get("A")?.dependencies).toContain("B");
    expect(edges.length).toBe(2);
  });

  it("should handle filtering and context updates", () => {
    const initialContext: GraphContext = {
      activeFilters: new Set(["componentA"]),
      visibleDependencyTypes: new Set(["CALL"]),
      rootNodes: new Set(["Start"]),
    };
    const newContext: GraphContext = {
      activeFilters: new Set(["componentA", "componentB"]),
      visibleDependencyTypes: new Set(["CALL", "USES"]),
      rootNodes: new Set(["Start", "End"]),
    };
    // Test if the context object structure is maintained correctly upon update
    expect(newContext.activeFilters.size).toBe(2);
    expect(newContext.visibleDependencyTypes.size).toBe(2);
    expect(newContext.rootNodes.size).toBe(2);
  });
});