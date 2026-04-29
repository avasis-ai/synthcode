import { describe, it, expect } from "vitest";
import { diffSemanticContextGraph } from "../src/schema/semantic-context-graph-diffing-v119";
import { Node, Edge } from "../src/schema/graph-types";

describe("diffSemanticContextGraph", () => {
  it("should correctly identify added, deleted, and modified nodes and edges", () => {
    const oldGraph: Node[] = [
      { id: "n1", type: "Person", properties: { name: "Alice" } },
      { id: "n2", type: "Organization", properties: { name: "Acme Corp" } },
    ];
    const oldEdges: Edge[] = [
      { id: "e1", source: "n1", target: "n2", type: "WORKS_FOR" },
    ];

    const newGraph: Node[] = [
      { id: "n1", type: "Person", properties: { name: "Alice" } }, // Unchanged
      { id: "n3", type: "Product", properties: { name: "Widget" } }, // Added
      { id: "n2", type: "Organization", properties: { name: "Acme Corp" } },
    ];
    const newEdges: Edge[] = [
      { id: "e1", source: "n1", target: "n2", type: "WORKS_FOR" }, // Unchanged
      { id: "e2", source: "n1", target: "n3", type: "USES" }, // Added
    ];

    const diff = diffSemanticContextGraph(oldGraph, oldEdges, newGraph, newEdges);

    expect(diff.addedNodes).toHaveLength(1);
    expect(diff.addedNodes[0].id).toBe("n3");
    expect(diff.deletedNodes).toHaveLength(0);
    expect(diff.modifiedNodes).toHaveLength(0);

    expect(diff.addedEdges).toHaveLength(1);
    expect(diff.addedEdges[0].id).toBe("e2");
    expect(diff.deletedEdges).toHaveLength(0);
    expect(diff.modifiedEdges).toHaveLength(0);

    expect(diff.semanticDrifts).toHaveLength(0);
  });

  it("should detect node property modifications and edge deletions", () => {
    const oldGraph: Node[] = [
      { id: "n1", type: "Person", properties: { name: "Alice", age: "30" } },
    ];
    const oldEdges: Edge[] = [
      { id: "e1", source: "n1", target: "n2", type: "KNOWS" },
      { id: "e_del", source: "n1", target: "n2", type: "OLD_RELATION" },
    ];

    const newGraph: Node[] = [
      { id: "n1", type: "Person", properties: { name: "Alice", age: "31" } }, // Modified age
    ];
    const newEdges: Edge[] = [
      { id: "e1", source: "n1", target: "n2", type: "KNOWS" },
    ];

    const diff = diffSemanticContextGraph(oldGraph, oldEdges, newGraph, newEdges);

    expect(diff.modifiedNodes).toHaveLength(1);
    expect(diff.modifiedNodes[0].node.id).toBe("n1");
    expect(diff.modifiedNodes[0].diff).toEqual({
      properties: { age: "31" } // Simplified check for modification detection
    });

    expect(diff.deletedEdges).toHaveLength(1);
    expect(diff.deletedEdges[0].id).toBe("e_del");
  });

  it("should report semantic drifts for missing or unexpected entities", () => {
    const oldGraph: Node[] = [
      { id: "n1", type: "Person", properties: { name: "Alice" } },
    ];
    const oldEdges: Edge[] = [
      { id: "e1", source: "n1", target: "n2", type: "WORKS_FOR" },
    ];

    const newGraph: Node[] = [
      { id: "n1", type: "Person", properties: { name: "Alice" } },
      // n2 is missing in the new graph, but referenced by an edge
    ];
    const newEdges: Edge[] = [
      { id: "e1", source: "n1", target: "n2", type: "WORKS_FOR" },
    ];

    const diff = diffSemanticContextGraph(oldGraph, oldEdges, newGraph, newEdges);

    // Assuming the diffing logic checks for dangling references (n2 in e1)
    expect(diff.semanticDrifts).toHaveLength(1);
    expect(diff.semanticDrifts[0].entity).toBe("edge");
    expect(diff.semanticDrifts[0].id).toBe("e1");
    expect(diff.semanticDrifts[0].severity).toBe("high");
  });
});