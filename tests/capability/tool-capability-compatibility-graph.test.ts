import { describe, it, expect } from "vitest";
import { ToolCapabilityCompatibilityGraph } from "../src/capability/tool-capability-compatibility-graph";
import { Graph } from "../src/capability/graph";

describe("ToolCapabilityCompatibilityGraph", () => {
  it("should initialize with a graph", () => {
    const graph = new ToolCapabilityCompatibilityGraph();
    expect(graph["graph"]).toBeInstanceOf(Graph);
  });

  it("should add compatibility edges correctly", () => {
    const graph = new ToolCapabilityCompatibilityGraph();
    graph.addCompatibilityEdge("capA", "capB", true);
    graph.addCompatibilityEdge("capA", "capC", false, "Conflict", "capA_v2");

    const edges = graph.getCompatibilityEdges();
    expect(edges).toHaveLength(2);

    const conflictEdge = edges.find(e => e.source === "capA" && e.target === "capC");
    expect(conflictEdge).toBeDefined();
    expect(conflictEdge!.compatible).toBe(false);
    expect(conflictEdge!.conflict).toBe("Conflict");
    expect(conflictEdge!.suggestedUpgrade).toBe("capA_v2");
  });

  it("should generate a compatibility report for known compatible capabilities", () => {
    const graph = new ToolCapabilityCompatibilityGraph();
    graph.addCompatibilityEdge("capA", "capB", true);
    graph.addCompatibilityEdge("capB", "capC", true);

    const report = graph.generateCompatibilityReport(["capA", "capB", "capC"]);
    expect(report.isCompatible).toBe(true);
    expect(report.conflicts).toHaveLength(0);
    expect(report.suggestedResolutions).toHaveLength(0);
  });
});