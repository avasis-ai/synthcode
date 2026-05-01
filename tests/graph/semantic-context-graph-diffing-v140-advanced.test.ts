import { describe, it, expect } from "vitest";
import { SemanticContextGraphDiffingV140Advanced } from "../src/graph/semantic-context-graph-diffing-v140-advanced";
import { Graph } from "../src/graph/graph-types";

describe("SemanticContextGraphDiffingV140Advanced", () => {
  it("should correctly calculate similarity when graphs are identical", () => {
    const graphA: Graph = {
      nodes: [{ id: "A", type: "Concept", score: 0.8 }, { id: "B", type: "Concept", score: 0.5 }],
      edges: [{ source: "A", target: "B", weight: 0.9 }],
    };
    const graphB: Graph = {
      nodes: [{ id: "A", type: "Concept", score: 0.8 }, { id: "B", type: "Concept", score: 0.5 }],
      edges: [{ source: "A", target: "B", weight: 0.9 }],
    };

    const diffing = new SemanticContextGraphDiffingV140Advanced();
    const report = diffing.diff(graphA, graphB);

    expect(report.driftDetected).toBe(false);
    expect(report.overallSimilarityScore).toBeCloseTo(1.0);
    expect(report.conceptDrift).toEqual([]);
    expect(report.relationshipDrift).toEqual([]);
  });

  it("should detect concept drift when a node score changes significantly", () => {
    const graphA: Graph = {
      nodes: [{ id: "C1", type: "Concept", score: 0.7 }],
      edges: [],
    };
    const graphB: Graph = {
      nodes: [{ id: "C1", type: "Concept", score: 0.2 }], // Significant drop
      edges: [],
    };

    const diffing = new SemanticContextGraphDiffingV140Advanced();
    const report = diffing.diff(graphA, graphB);

    expect(report.driftDetected).toBe(true);
    expect(report.conceptDrift.length).toBe(1);
    expect(report.conceptDrift[0].conceptId).toBe("C1");
    expect(report.conceptDrift[0].oldScore).toBe(0.7);
    expect(report.conceptDrift[0].newScore).toBe(0.2);
    expect(report.conceptDrift[0].severity).toBe('High');
  });

  it("should detect relationship drift when an edge weight changes", () => {
    const graphA: Graph = {
      nodes: [{ id: "X", type: "Concept", score: 0.9 }, { id: "Y", type: "Concept", score: 0.6 }],
      edges: [{ source: "X", target: "Y", weight: 0.95 }],
    };
    const graphB: Graph = {
      nodes: [{ id: "X", type: "Concept", score: 0.9 }, { id: "Y", type: "Concept", score: 0.6 }],
      edges: [{ source: "X", target: "Y", weight: 0.3 }], // Significant drop
    };

    const diffing = new SemanticContextGraphDiffingV140Advanced();
    const report = diffing.diff(graphA, graphB);

    expect(report.driftDetected).toBe(true);
    expect(report.relationshipDrift.length).toBe(1);
    expect(report.relationshipDrift[0].sourceId).toBe("X");
    expect(report.relationshipDrift[0].targetId).toBe("Y");
    expect(report.relationshipDrift[0].oldWeight).toBe(0.95);
    expect(report.relationshipDrift[0].newWeight).toBe(0.3);
    expect(report.relationshipDrift[0].severity).toBe('High');
  });
});