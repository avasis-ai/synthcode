import { describe, it, expect } from "vitest";
import { ContextualKnowledgeGraphDiffer } from "../src/graph/contextual-knowledge-graph-diffing-v150";
import { Graph, Triple } from "../src/graph/graph-types";

describe("ContextualKnowledgeGraphDiffer", () => {
  it("should correctly identify added triples when graphB has new information", () => {
    const graphA: Graph = {
      nodes: [{ id: "A", label: "EntityA" }],
      edges: [
        { subject: "A", predicate: "knows", object: "B" },
      ],
    };
    const graphB: Graph = {
      nodes: [{ id: "A", label: "EntityA" }, { id: "C", label: "EntityC" }],
      edges: [
        { subject: "A", predicate: "knows", object: "B" },
        { subject: "A", predicate: "relatedTo", object: "C" },
      ],
    };

    const differ = new ContextualKnowledgeGraphDiffer(graphA, graphB);
    const diff = differ.diff();

    expect(diff.addedTriples).toHaveLength(1);
    expect(diff.addedTriples[0]).toEqual({ subject: "A", predicate: "relatedTo", object: "C" });
    expect(diff.deletedTriples).toHaveLength(0);
    expect(diff.modifiedTriples).toHaveLength(0);
  });

  it("should correctly identify deleted triples when graphB is missing information", () => {
    const graphA: Graph = {
      nodes: [{ id: "A", label: "EntityA" }],
      edges: [
        { subject: "A", predicate: "knows", object: "B" },
        { subject: "A", predicate: "relatedTo", object: "C" },
      ],
    };
    const graphB: Graph = {
      nodes: [{ id: "A", label: "EntityA" }],
      edges: [
        { subject: "A", predicate: "knows", object: "B" },
      ],
    };

    const differ = new ContextualKnowledgeGraphDiffer(graphA, graphB);
    const diff = differ.diff();

    expect(diff.addedTriples).toHaveLength(0);
    expect(diff.deletedTriples).toHaveLength(1);
    expect(diff.deletedTriples[0]).toEqual({ subject: "A", predicate: "relatedTo", object: "C" });
    expect(diff.modifiedTriples).toHaveLength(0);
  });

  it("should correctly identify modified triples when an edge changes", () => {
    const graphA: Graph = {
      nodes: [{ id: "A", label: "EntityA" }, { id: "B", label: "EntityB" }],
      edges: [
        { subject: "A", predicate: "knows", object: "B" },
      ],
    };
    const graphB: Graph = {
      nodes: [{ id: "A", label: "EntityA" }, { id: "B", label: "EntityB" }],
      edges: [
        { subject: "A", predicate: "knows", object: "C" }, // Object changed
      ],
    };

    const differ = new ContextualKnowledgeGraphDiffer(graphA, graphB);
    const diff = differ.diff();

    expect(diff.addedTriples).toHaveLength(0);
    expect(diff.deletedTriples).toHaveLength(0);
    expect(diff.modifiedTriples).toHaveLength(1);
    expect(diff.modifiedTriples[0].old).toEqual({ subject: "A", predicate: "knows", object: "B" });
    expect(diff.modifiedTriples[0].new).toEqual({ subject: "A", predicate: "knows", object: "C" });
  });
});