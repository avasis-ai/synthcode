import { describe, it, expect } from "vitest";
import { mergeSemanticContextGraph } from "../semantic-context-graph-merger-v1001-advanced-advanced";
import { Message } from "../types";

describe("mergeSemanticContextGraph", () => {
  it("should correctly merge two graphs with overlapping nodes and unique edges", async () => {
    const graph1: { nodes: Map<string, any>; edges: Map<string, any> } = {
      nodes: new Map([
        ["nodeA", { id: "nodeA", label: "A", attributes: { color: "red" }, source_evidence: [{ source_id: "src1", timestamp: 100 }] }],
        ["nodeB", { id: "nodeB", label: "B", attributes: { color: "blue" }, source_evidence: [{ source_id: "src1", timestamp: 100 }] }],
      ]),
      edges: new Map([
        ["edge1", { source_id: "nodeA", target_id: "nodeB", relationship: "RELATED" }],
      ]),
    };

    const graph2: { nodes: Map<string, any>; edges: Map<string, any> } = {
      nodes: new Map([
        ["nodeB", { id: "nodeB", label: "B", attributes: { weight: 0.5 }, source_evidence: [{ source_id: "src2", timestamp: 200 }] }],
        ["nodeC", { id: "nodeC", label: "C", attributes: { type: "info" }, source_evidence: [{ source_id: "src2", timestamp: 200 }] }],
      ]),
      edges: new Map([
        ["edge2", { source_id: "nodeB", target_id: "nodeC", relationship: "FOLLOWS" }],
      ]),
    };

    const mergedGraph = await mergeSemanticContextGraph(graph1, graph2);

    // Check nodes
    expect(mergedGraph.nodes.size).toBe(3);
    expect(mergedGraph.nodes.get("nodeA")!.attributes.color).toBe("red");
    expect(mergedGraph.nodes.get("nodeB")!.attributes.color).toBe("blue"); // Should keep attributes from the first source or merge if logic dictates
    expect(mergedGraph.nodes.get("nodeB")!.attributes.weight).toBe(0.5); // Check merge of attributes
    expect(mergedGraph.nodes.get("nodeB")!.source_evidence).toHaveLength(2);
    expect(mergedGraph.nodes.get("nodeB")!.source_evidence).toEqual(expect.arrayContaining([
      { source_id: "src1", timestamp: 100 },
      { source_id: "src2", timestamp: 200 },
    ]));

    // Check edges
    expect(mergedGraph.edges.size).toBe(2);
    expect(mergedGraph.edges.get("edge1")!.source_id).toBe("nodeA");
    expect(mergedGraph.edges.get("edge2")!.relationship).toBe("FOLLOWS");
  });

  it("should handle merging graphs where one graph is empty", async () => {
    const graph1: { nodes: Map<string, any>; edges: Map<string, any> } = {
      nodes: new Map([
        ["nodeA", { id: "nodeA", label: "A", attributes: {}, source_evidence: [] }],
      ]),
      edges: new Map(),
    };

    const graph2: { nodes: Map<string, any>; edges: Map<string, any> } = {
      nodes: new Map(),
      edges: new Map(),
    };

    const mergedGraph = await mergeSemanticContextGraph(graph1, graph2);

    expect(mergedGraph.nodes.size).toBe(1);
    expect(mergedGraph.edges.size).toBe(0);
  });

  it("should maintain the integrity of nodes and edges when merging identical graphs", async () => {
    const graph1: { nodes: Map<string, any>; edges: Map<string, any> } = {
      nodes: new Map([
        ["nodeX", { id: "nodeX", label: "X", attributes: { initial: true }, source_evidence: [{ source_id: "srcX", timestamp: 1 }] }],
      ]),
      edges: new Map([
        ["edgeX", { source_id: "nodeX", target_id: "nodeX", relationship: "SELF" }],
      ]),
    };

    const graph2: { nodes: Map<string, any>; edges: Map<string, any> } = {
      nodes: new Map([
        ["nodeX", { id: "nodeX", label: "X", attributes: { initial: true }, source_evidence: [{ source_id: "srcX", timestamp: 1 }] }],
      ]),
      edges: new Map([
        ["edgeX", { source_id: "nodeX", target_id: "nodeX", relationship: "SELF" }],
      ]),
    };

    const mergedGraph = await mergeSemanticContextGraph(graph1, graph2);

    // Expecting the result to be structurally sound, potentially favoring the first graph's data if no merge logic is specified for identical items
    expect(mergedGraph.nodes.size).toBe(1);
    expect(mergedGraph.nodes.get("nodeX")!.attributes.initial).toBe(true);
    expect(mergedGraph.nodes.get("nodeX")!.source_evidence).toHaveLength(1); // Should not duplicate evidence if logic is smart
    expect(mergedGraph.edges.size).toBe(1);
  });
});