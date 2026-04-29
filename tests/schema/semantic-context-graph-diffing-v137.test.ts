import { describe, it, expect } from "vitest";
import { SemanticContextGraphDiffingV137 } from "../src/schema/semantic-context-graph-diffing-v137";
import { Graph, Node, Edge } from "../src/schema/graph-types";

describe("SemanticContextGraphDiffingV137", () => {
  it("should correctly identify added and deleted nodes when graph structure changes", () => {
    const initialGraph: Graph = {
      nodes: [
        { id: "A", type: "User", properties: { name: "Alice" } },
        { id: "B", type: "Product", properties: { sku: "P101" } },
      ],
      edges: [
        { source: "A", target: "B", type: "PURCHASED", properties: { date: "2023-01-01" } },
      ],
    };

    const updatedGraph: Graph = {
      nodes: [
        { id: "A", type: "User", properties: { name: "Alice" } },
        { id: "B", type: "Product", properties: { sku: "P101" } },
        { id: "C", type: "Service", properties: { name: "ServiceX" } }, // Added Node
      ],
      edges: [
        { source: "A", target: "B", type: "PURCHASED", properties: { date: "2023-01-01" } },
        { source: "A", target: "C", type: "USED", properties: { date: "2023-02-01" } }, // Added Edge
      ],
    };

    const diffTool = new SemanticContextGraphDiffingV137();
    const diffReport = diffTool.diff(initialGraph, updatedGraph);

    expect(diffReport.addedNodes).toHaveLength(1);
    expect(diffReport.addedNodes.some(n => n.id === "C")).toBe(true);
    expect(diffReport.deletedNodes).toHaveLength(0);
    expect(diffReport.addedEdges).toHaveLength(1);
    expect(diffReport.addedEdges.some(e => e.source === "A" && e.target === "C")).toBe(true);
    expect(diffReport.summary.nodeCountDelta).toBe(1);
    expect(diffReport.summary.edgeCountDelta).toBe(1);
  });

  it("should detect modifications in node properties and edges", () => {
    const initialGraph: Graph = {
      nodes: [
        { id: "U1", type: "User", properties: { name: "Bob", email: "bob@old.com" } },
      ],
      edges: [
        { source: "U1", target: "P1", type: "VIEWED", properties: { timestamp: "2023-01-01T00:00:00Z" } },
      ],
    };

    const updatedGraph: Graph = {
      nodes: [
        { id: "U1", type: "User", properties: { name: "Bob", email: "bob@new.com" } }, // Modified Node
      ],
      edges: [
        { source: "U1", target: "P1", type: "VIEWED", properties: { timestamp: "2023-01-01T00:00:00Z" } }, // Unchanged Edge
      ],
    };

    const diffTool = new SemanticContextGraphDiffingV137();
    const diffReport = diffTool.diff(initialGraph, updatedGraph);

    expect(diffReport.modifiedNodes).toHaveLength(1);
    expect(diffReport.modifiedNodes[0].node.id).toBe("U1");
    expect(diffReport.modifiedNodes[0].changes).toEqual(
      expect.objectContaining({ email: "bob@new.com" })
    );
    expect(diffReport.modifiedEdges).toHaveLength(0);
    expect(diffReport.summary.nodeCountDelta).toBe(0);
  });

  it("should report deletions for nodes and edges", () => {
    const initialGraph: Graph = {
      nodes: [
        { id: "A", type: "User", properties: { name: "Alice" } },
        { id: "B", type: "Product", properties: { sku: "P101" } },
      ],
      edges: [
        { source: "A", target: "B", type: "PURCHASED", properties: { date: "2023-01-01" } },
        { source: "A", target: "C", type: "IGNORED", properties: {} }, // Deleted Edge
      ],
    };

    const updatedGraph: Graph = {
      nodes: [
        { id: "A", type: "User", properties: { name: "Alice" } },
        { id: "B", type: "Product", properties: { sku: "P101" } },
      ],
      edges: [
        { source: "A", target: "B", type: "PURCHASED", properties: { date: "2023-01-01" } },
      ],
    };

    const diffTool = new SemanticContextGraphDiffingV137();
    const diffReport = diffTool.diff(initialGraph, updatedGraph);

    expect(diffReport.deletedNodes).toHaveLength(0);
    expect(diffReport.deletedEdges).toHaveLength(1);
    expect(diffReport.deletedEdges[0].source).toBe("A");
    expect(diffReport.deletedEdges[0].target).toBe("C");
    expect(diffReport.summary.nodeCountDelta).toBe(0);
    expect(diffReport.summary.edgeCountDelta).toBe(-1);
  });
});