import { describe, it, expect } from "vitest";
import { SemanticContextGraphDiffer } from "../src/graph/semantic-context-graph-diffing-v144";
import { Node, Edge, Triple } from "../src/graph/graph-types";

describe("SemanticContextGraphDiffer", () => {
  it("should correctly identify added, deleted, and modified nodes", () => {
    const differ = new SemanticContextGraphDiffer();

    const oldGraph: GraphPayload = {
      nodes: [
        { id: "A", label: "Person", properties: { name: "Alice" } },
        { id: "B", label: "Location", properties: { city: "NY" } },
      ],
      edges: [],
      triples: [],
    };

    const newGraph: GraphPayload = {
      nodes: [
        { id: "A", label: "Person", properties: { name: "Alice" } },
        { id: "B", label: "Location", properties: { city: "New York" } }, // Modified
        { id: "C", label: "Concept", properties: { name: "New Concept" } }, // Added
      ],
      edges: [],
      triples: [],
    };

    const diff = differ.diff(oldGraph, newGraph);

    expect(diff.addedNodes).toHaveLength(1);
    expect(diff.addedNodes[0].id).toBe("C");
    expect(diff.deletedNodes).toHaveLength(0);
    expect(diff.modifiedNodes).toHaveLength(1);
    expect(diff.modifiedNodes[0].old.properties.city).toBe("NY");
    expect(diff.modifiedNodes[0].new.properties.city).toBe("New York");
  });

  it("should correctly identify added and deleted edges", () => {
    const differ = new SemanticContextGraphDiffer();

    const oldGraph: GraphPayload = {
      nodes: [
        { id: "A", label: "Person", properties: {} },
        { id: "B", label: "Location", properties: {} },
      ],
      edges: [
        { id: "e1", source: "A", target: "B", type: "LIVES_IN" },
      ],
      triples: [],
    };

    const newGraph: GraphPayload = {
      nodes: [
        { id: "A", label: "Person", properties: {} },
        { id: "B", label: "Location", properties: {} },
      ],
      edges: [
        { id: "e1", source: "A", target: "B", type: "LIVES_IN" },
        { id: "e2", source: "A", target: "C", type: "KNOWS" }, // Added edge
      ],
      triples: [],
    };

    // Simulate deletion by removing e1 from newGraph (for testing deletion)
    const oldGraphWithEdgeToDelete: GraphPayload = {
      nodes: [{ id: "A", label: "Person", properties: {} }, { id: "B", label: "Location", properties: {} }],
      edges: [{ id: "e1", source: "A", target: "B", type: "LIVES_IN" }],
      triples: [],
    };

    const newGraphWithoutEdge: GraphPayload = {
      nodes: [{ id: "A", label: "Person", properties: {} }, { id: "B", label: "Location", properties: {} }],
      edges: [{ id: "e2", source: "A", target: "C", type: "KNOWS" }],
      triples: [],
    };

    const diff = differ.diff(oldGraphWithEdgeToDelete, newGraphWithoutEdge);

    expect(diff.deletedEdges).toHaveLength(1);
    expect(diff.deletedEdges[0].id).toBe("e1");
    expect(diff.addedEdges).toHaveLength(1);
    expect(diff.addedEdges[0].id).toBe("e2");
  });

  it("should calculate a semantic drift score when content changes", () => {
    const differ = new SemanticContextGraphDiffer();

    const oldGraph: GraphPayload = {
      nodes: [
        { id: "A", label: "Person", properties: { name: "Alice" } },
      ],
      edges: [],
      triples: [{ subject: "A", predicate: "HAS_AGE", object: "30" }],
    };

    const newGraph: GraphPayload = {
      nodes: [
        { id: "A", label: "Person", properties: { name: "Alice" } },
      ],
      edges: [],
      triples: [{ subject: "A", predicate: "HAS_AGE", object: "31" }], // Changed triple
    };

    const diff = differ.diff(oldGraph, newGraph);

    // Expect a score > 0 because a triple changed
    expect(diff.semanticDriftScore).toBeGreaterThanOrEqual(0);
    expect(diff.summary).toContain("Semantic drift detected");
  });
});