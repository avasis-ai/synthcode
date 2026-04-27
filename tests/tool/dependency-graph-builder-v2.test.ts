import { describe, it, expect } from "vitest";
import { DependencyGraphBuilderV2, DependencyGraph } from "../src/tool/dependency-graph-builder-v2";

describe("DependencyGraphBuilderV2", () => {
  it("should initialize an empty graph correctly", () => {
    const builder = new DependencyGraphBuilderV2();
    const graph: DependencyGraph = builder.buildGraph();
    expect(graph.nodes.size).toBe(0);
    expect(graph.adjacencyList.size).toBe(0);
    expect(graph.totalWeight).toBe(0);
  });

  it("should correctly build a graph from a list of edges", () => {
    const builder = new DependencyGraphBuilderV2();
    const edges: { source: string; target: string; weight: number; dependencyType: 'cost' | 'reliability'; }[] = [
      { source: "A", target: "B", weight: 0.5, dependencyType: "cost" },
      { source: "B", target: "C", weight: 0.8, dependencyType: "reliability" },
      { source: "A", target: "C", weight: 0.2, dependencyType: "cost" },
    ];
    builder.addEdges(edges);
    const graph: DependencyGraph = builder.buildGraph();

    expect(graph.nodes.size).toBe(3);
    expect(graph.totalWeight).toBeCloseTo(1.5);

    expect(graph.adjacencyList.get("A")?.length).toBe(2);
    expect(graph.adjacencyList.get("A")?.some(e => e.target === "B" && e.weight === 0.5)).toBe(true);
    expect(graph.adjacencyList.get("B")?.length).toBe(1);
    expect(graph.adjacencyList.get("C")?.length).toBe(0);
  });

  it("should handle duplicate edges by aggregating weights (if logic supports it)", () => {
    const builder = new DependencyGraphBuilderV2();
    // Assuming the builder aggregates weights for the same (source, target, type) pair
    const edges: { source: string; target: string; weight: number; dependencyType: 'cost' | 'reliability'; }[] = [
      { source: "X", target: "Y", weight: 0.3, dependencyType: "cost" },
      { source: "X", target: "Y", weight: 0.7, dependencyType: "cost" }, // Duplicate type/pair
    ];
    builder.addEdges(edges);
    const graph: DependencyGraph = builder.buildGraph();

    // If the builder sums weights for identical edges, the total weight should be 1.0
    expect(graph.totalWeight).toBeCloseTo(1.0);
    const edgesFromX = graph.adjacencyList.get("X");
    expect(edgesFromX?.length).toBe(1);
    expect(edgesFromX?.find(e => e.target === "Y" && e.weight === 1.0)).toBeDefined();
  });
});