import { describe, it, expect } from "vitest";
import { DependencyGraphAnalyzer } from "../src/tool/dependency-graph-analyzer";

describe("DependencyGraphAnalyzer", () => {
  it("should correctly determine execution order for a linear dependency chain", () => {
    const analyzer = new DependencyGraphAnalyzer();
    const graph = new Map([
      ["A", new Set(["B"])],
      ["B", new Set(["C"])],
      ["C", new Set()],
    ]);
    analyzer.setGraph(graph);

    const result = analyzer.analyze();
    expect(result.executionOrder).toEqual(["A", "B", "C"]);
    expect(result.hasCycle).toBe(false);
    expect(result.cycles).toEqual([]);
    expect(result.missingDependencies).toEqual([]);
  });

  it("should detect a simple cycle in the dependency graph", () => {
    const analyzer = new DependencyGraphAnalyzer();
    const graph = new Map([
      ["A", new Set(["B"])],
      ["B", new Set(["C"])],
      ["C", new Set(["A"])],
    ]);
    analyzer.setGraph(graph);

    const result = analyzer.analyze();
    expect(result.hasCycle).toBe(true);
    expect(result.cycles).toHaveLength(1);
    expect(result.cycles[0]).toEqual(["A", "B", "C", "A"]); // Order might vary, but cycle detection should work
  });

  it("should handle a graph with no dependencies", () => {
    const analyzer = new DependencyGraphAnalyzer();
    const graph = new Map([
      ["A", new Set()],
      ["B", new Set()],
    ]);
    analyzer.setGraph(graph);

    const result = analyzer.analyze();
    expect(result.executionOrder).toEqual(["A", "B"]); // Order might vary, but all nodes should be present
    expect(result.hasCycle).toBe(false);
    expect(result.cycles).toEqual([]);
    expect(result.missingDependencies).toEqual([]);
  });
});