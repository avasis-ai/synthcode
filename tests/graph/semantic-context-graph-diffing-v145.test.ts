import { describe, it, expect } from "vitest";
import { SemanticContextGraphDiffingV145 } from "../src/graph/semantic-context-graph-diffing-v145";
import { Graph, Node, Edge } from "../src/graph/graph-types";

describe("SemanticContextGraphDiffingV145", () => {
  it("should calculate zero drift for identical graphs", () => {
    const graphA: Graph = {
      nodes: [
        { id: "n1", properties: { type: "A", value: 1 } },
        { id: "n2", properties: { type: "B", value: 2 } },
      ],
      edges: [
        { id: "e1", source: "n1", target: "n2", properties: { relation: "R1", weight: 0.5 } },
      ],
    };
    const graphB: Graph = {
      nodes: [
        { id: "n1", properties: { type: "A", value: 1 } },
        { id: "n2", properties: { type: "B", value: 2 } },
      ],
      edges: [
        { id: "e1", source: "n1", target: "n2", properties: { relation: "R1", weight: 0.5 } },
      ],
    };

    const diffing = new SemanticContextGraphDiffingV145();
    const report = diffing.diff(graphA, graphB);

    expect(report.nodeDiffs).toHaveLength(0);
    expect(report.edgeDiffs).toHaveLength(0);
    expect(report.summary.semanticDriftScore).toBeCloseTo(0);
  });

  it("should detect drift in node properties", () => {
    const graphA: Graph = {
      nodes: [
        { id: "n1", properties: { type: "A", value: 1 } },
        { id: "n2", properties: { type: "B", value: 2 } },
      ],
      edges: [
        { id: "e1", source: "n1", target: "n2", properties: { relation: "R1", weight: 0.5 } },
      ],
    };
    const graphB: Graph = {
      nodes: [
        { id: "n1", properties: { type: "A", value: 1.1 } }, // Drift here
        { id: "n2", properties: { type: "B", value: 2 } },
      ],
      edges: [
        { id: "e1", source: "n1", target: "n2", properties: { relation: "R1", weight: 0.5 } },
      ],
    };

    const diffing = new SemanticContextGraphDiffingV145();
    const report = diffing.diff(graphA, graphB);

    expect(report.nodeDiffs).toHaveLength(1);
    expect(report.nodeDiffs[0].nodeId).toBe("n1");
    expect(report.nodeDiffs[0].semanticDrift).toBeGreaterThan(0);
    expect(report.edgeDiffs).toHaveLength(0);
  });

  it("should detect drift in edge properties", () => {
    const graphA: Graph = {
      nodes: [
        { id: "n1", properties: { type: "A", value: 1 } },
        { id: "n2", properties: { type: "B", value: 2 } },
      ],
      edges: [
        { id: "e1", source: "n1", target: "n2", properties: { relation: "R1", weight: 0.5 } },
      ],
    };
    const graphB: Graph = {
      nodes: [
        { id: "n1", properties: { type: "A", value: 1 } },
        { id: "n2", properties: { type: "B", value: 2 } },
      ],
      edges: [
        { id: "e1", source: "n1", target: "n2", properties: { relation: "R1", weight: 0.6 } }, // Drift here
      ],
    };

    const diffing = new SemanticContextGraphDiffingV145();
    const report = diffing.diff(graphA, graphB);

    expect(report.nodeDiffs).toHaveLength(0);
    expect(report.edgeDiffs).toHaveLength(1);
    expect(report.edgeDiffs[0].edgeId).toBe("e1");
    expect(report.edgeDiffs[0].semanticDrift).toBeGreaterThan(0);
  });
});