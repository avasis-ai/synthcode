import { describe, it, expect } from "vitest";
import { ToolCallDependencyGraphAnalyzer, GraphNode } from "../src/graph/tool-call-dependency-graph-analyzer";

describe("ToolCallDependencyGraphAnalyzer", () => {
  it("should correctly build the graph and detect no cycles for a simple linear dependency", () => {
    const analyzer = new ToolCallDependencyGraphAnalyzer();
    const graphNodes: GraphNode[] = [
      { id: "A", name: "Tool A", dependencies: [] },
      { id: "B", name: "Tool B", dependencies: ["A"] },
      { id: "C", name: "Tool C", dependencies: ["B"] },
    ];
    analyzer.setGraph(graphNodes);

    // Assuming the analyzer has a method to analyze, we'll test the setup and a basic analysis check
    // Since the full analysis method isn't provided, we test the setup and assume a basic analysis call works.
    // For this test, we'll just check if setting the graph doesn't throw and assume a non-cyclic report.
    const report = (analyzer as any).analyzeGraph();
    expect(report.hasCycle).toBe(false);
    expect(report.cycleCount).toBe(0);
  });

  it("should detect a cycle when dependencies form a loop", () => {
    const analyzer = new ToolCallDependencyGraphAnalyzer();
    const graphNodes: GraphNode[] = [
      { id: "T1", name: "Tool 1", dependencies: ["T3"] },
      { id: "T2", name: "Tool 2", dependencies: ["T1"] },
      { id: "T3", name: "Tool 3", dependencies: ["T2"] }, // T3 -> T2 -> T1 -> T3 (Cycle)
    ];
    analyzer.setGraph(graphNodes);

    const report = (analyzer as any).analyzeGraph();
    expect(report.hasCycle).toBe(true);
    expect(report.cycleCount).toBeGreaterThan(0);
  });

  it("should handle an empty graph gracefully", () => {
    const analyzer = new ToolCallDependencyGraphAnalyzer();
    const graphNodes: GraphNode[] = [];
    analyzer.setGraph(graphNodes);

    const report = (analyzer as any).analyzeGraph();
    expect(report.hasCycle).toBe(false);
    expect(report.cycleCount).toBe(0);
    expect(report.maxDepth).toBe(0);
  });
});