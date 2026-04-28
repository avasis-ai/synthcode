import { describe, it, expect } from "vitest";
import { diffSemanticContextGraph } from "../src/graph/semantic-context-graph-diffing";
import { Graph, Node, Edge } from "../src/graph/graph-types";

describe("diffSemanticContextGraph", () => {
  it("should correctly identify added, removed, and modified nodes and edges", () => {
    const oldGraph: Graph = {
      nodes: [
        { id: "n1", type: "concept", content: "A" },
        { id: "n2", type: "concept", content: "B" },
      ],
      edges: [
        { id: "e1", sourceId: "n1", targetId: "n2", weight: 0.8 },
      ],
    };

    const newGraph: Graph = {
      nodes: [
        { id: "n1", type: "concept", content: "A_modified" }, // Modified
        { id: "n2", type: "concept", content: "B" },
        { id: "n3", type: "concept", content: "C" }, // Added
      ],
      edges: [
        { id: "e1", sourceId: "n1", targetId: "n2", weight: 0.9 }, // Modified
        { id: "e2", sourceId: "n1", targetId: "n3", weight: 0.5 }, // Added
      ],
    };

    const diff = diffSemanticContextGraph(oldGraph, newGraph);

    // Check node diffs
    expect(diff.nodeDiffs).toHaveLength(3);
    const nodeDiffs = diff.nodeDiffs;
    expect(nodeDiffs).toEqual(expect.arrayContaining([
      expect.objectContaining({ nodeId: "n1", type: "modified" }),
      expect.objectContaining({ nodeId: "n3", type: "added" }),
      expect.objectContaining({ nodeId: "n2", type: "unchanged" }), // Assuming unchanged nodes are included or handled
    ]));

    // Check edge diffs
    expect(diff.edgeDiffs).toHaveLength(3);
    const edgeDiffs = diff.edgeDiffs;
    expect(edgeDiffs).toEqual(expect.arrayContaining([
      expect.objectContaining({ edgeId: "e1", type: "modified" }),
      expect.objectContaining({ edgeId: "e2", type: "added" }),
      expect.objectContaining({ edgeId: "e_removed", type: "removed" }), // Assuming a removed edge is tested
    ]));
  });

  it("should return empty diff when graphs are identical", () => {
    const graph: Graph = {
      nodes: [
        { id: "n1", type: "concept", content: "Test" },
      ],
      edges: [
        { id: "e1", sourceId: "n1", targetId: "n1", weight: 1.0 },
      ],
    };

    const diff = diffSemanticContextGraph(graph, graph);
    expect(diff.nodeDiffs).toEqual([]);
    expect(diff.edgeDiffs).toEqual([]);
  });

  it("should handle removal of all nodes and edges", () => {
    const oldGraph: Graph = {
      nodes: [
        { id: "n1", type: "concept", content: "A" },
      ],
      edges: [
        { id: "e1", sourceId: "n1", targetId: "n1", weight: 1.0 },
      ],
    };

    const newGraph: Graph = {
      nodes: [],
      edges: [],
    };

    const diff = diffSemanticContextGraph(oldGraph, newGraph);

    // Expect all nodes to be marked as removed
    expect(diff.nodeDiffs.filter(d => d.type === "removed")).toHaveLength(1);
    expect(diff.nodeDiffs[0].nodeId).toBe("n1");

    // Expect all edges to be marked as removed
    expect(diff.edgeDiffs.filter(d => d.type === "removed")).toHaveLength(1);
    expect(diff.edgeDiffs[0].edgeId).toBe("e1");
  });
});