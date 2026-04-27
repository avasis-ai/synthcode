import { describe, it, expect } from "vitest";
import { DependencyGraphAnalyzer, DependencyGraph } from "../src/dependency/dependency-graph-analyzer";

describe("DependencyGraphAnalyzer", () => {
  it("should correctly build a dependency graph from a set of nodes", () => {
    const nodes: Record<string, any> = {
      "A": { name: "A", description: "Desc A", inputs: [], outputs: ["B"], dependencies: [] },
      "B": { name: "B", description: "Desc B", inputs: ["A"], outputs: ["C"], dependencies: ["A"] },
      "C": { name: "C", description: "Desc C", inputs: ["B"], outputs: [], dependencies: ["B"] },
    };

    const graph = new DependencyGraphAnalyzer(nodes);
    const graphData: DependencyGraph = graph.buildGraph();

    expect(graphData.nodes.size).toBe(3);
    expect(graphData.nodes.get("A")?.name).toBe("A");
    expect(graphData.adjList.get("A")?.has("B")).toBe(true);
    expect(graphData.adjList.get("B")?.has("C")).toBe(true);
    expect(graphData.adjList.get("C")).toBeUndefined();
  });

  it("should detect a simple cycle in the dependency graph", () => {
    const nodes: Record<string, any> = {
      "N1": { name: "N1", description: "Desc N1", inputs: [], outputs: ["N2"], dependencies: ["N3"] },
      "N2": { name: "N2", description: "Desc N2", inputs: ["N1"], outputs: ["N3"], dependencies: ["N1"] },
      "N3": { name: "N3", description: "Desc N3", inputs: ["N2"], outputs: [], dependencies: ["N2"] },
    };

    const graph = new DependencyGraphAnalyzer(nodes);
    const report = graph.analyze();

    expect(report.cycles.length).toBeGreaterThan(0);
    expect(report.cycles).toEqual(expect.arrayContaining(["N1 -> N2 -> N3 -> N1"]));
  });

  it("should detect missing prerequisites when dependencies are listed but nodes are missing", () => {
    const nodes: Record<string, any> = {
      "Start": { name: "Start", description: "Start", inputs: [], outputs: ["End"], dependencies: ["MissingDep"] },
      "End": { name: "End", description: "End", inputs: ["Start"], outputs: [], dependencies: ["Start"] },
    };

    const graph = new DependencyGraphAnalyzer(nodes);
    const report = graph.analyze();

    expect(report.missingPrerequisites.length).toBe(1);
    expect(report.missingPrerequisites[0].node).toBe("Start");
    expect(report.missingPrerequisites[0].missing).toBe("MissingDep");
  });
});