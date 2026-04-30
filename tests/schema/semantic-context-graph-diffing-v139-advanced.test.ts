import { describe, it, expect } from "vitest";
import { GraphDiffingService } from "../src/schema/semantic-context-graph-diffing-v139-advanced";
import { Graph } from "../src/schema/graph-types";

describe("GraphDiffingService", () => {
  it("should correctly report added, removed, and modified nodes", () => {
    const service = new GraphDiffingService();
    // Mock graphs for testing basic diffing
    const graphA: Graph = {
      nodes: [
        { id: "n1", type: "A", attributes: { value: 1 } },
        { id: "n2", type: "B", attributes: { value: 2 } },
      ],
      edges: [
        { id: "e1", source: "n1", target: "n2", attributes: { weight: 0.9 } },
      ],
    };
    const graphB: Graph = {
      nodes: [
        { id: "n1", type: "A", attributes: { value: 1 } }, // Unchanged
        { id: "n2", type: "B", attributes: { value: 2.1 } }, // Modified
        { id: "n3", type: "C", attributes: { value: 3 } }, // Added
      ],
      edges: [
        { id: "e1", source: "n1", target: "n2", attributes: { weight: 0.9 } }, // Unchanged
        { id: "e2", source: "n1", target: "n3", attributes: { weight: 0.5 } }, // Added
      ],
    };

    const diffReport = service.compareGraphs(graphA, graphB);

    expect(diffReport.added).toHaveLength(1);
    expect(diffReport.added[0].nodeId).toBe("n3");

    expect(diffReport.removed).toHaveLength(0);

    expect(diffReport.modified).toHaveLength(1);
    expect(diffReport.modified[0].nodeId).toBe("n2");
    expect(diffReport.modified[0].changes).toHaveLength(1);
    expect(diffReport.modified[0].changes[0].attribute).toBe("value");
    expect(diffReport.modified[0].changes[0].from).toBe(2);
    expect(diffReport.modified[0].changes[0].to).toBe(2.1);
  });

  it("should detect semantically drifted edges", () => {
    const service = new GraphDiffingService();
    // Setup graphs where an edge exists but its semantic context changes significantly
    const graphA: Graph = {
      nodes: [
        { id: "n1", type: "Start", attributes: {} },
        { id: "n2", type: "End", attributes: {} },
      ],
      edges: [
        { id: "e1", source: "n1", target: "n2", attributes: { relation: "direct" } },
      ],
    };
    const graphB: Graph = {
      nodes: [
        { id: "n1", type: "Start", attributes: {} },
        { id: "n2", type: "End", attributes: {} },
      ],
      edges: [
        // Edge e1 remains, but its context might imply a different relationship type
        { id: "e1", source: "n1", target: "n2", attributes: { relation: "indirect" } },
      ],
    };

    const diffReport = service.compareGraphs(graphA, graphB);

    // Assuming the service detects the change in 'relation' attribute as a semantic drift
    expect(diffReport.semanticallyDrifted).toHaveLength(1);
    expect(diffReport.semanticallyDrifted[0].edgeId).toBe("e1");
    expect(diffReport.semanticallyDrifted[0].reason).toContain("relation");
  });

  it("should return empty reports for identical graphs", () => {
    const service = new GraphDiffingService();
    const graph: Graph = {
      nodes: [
        { id: "n1", type: "A", attributes: { value: 1 } },
        { id: "n2", type: "B", attributes: { value: 2 } },
      ],
      edges: [
        { id: "e1", source: "n1", target: "n2", attributes: { weight: 0.9 } },
      ],
    };

    const diffReport = service.compareGraphs(graph, graph);

    expect(diffReport.added).toHaveLength(0);
    expect(diffReport.removed).toHaveLength(0);
    expect(diffReport.modified).toHaveLength(0);
    expect(diffReport.semanticallyDrifted).toHaveLength(0);
  });
});