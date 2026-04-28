import { describe, it, expect } from "vitest";
import { SemanticContextGraphMergerV1 } from "../src/schema/semantic-context-graph-merger-v1";

describe("SemanticContextGraphMergerV1", () => {
  it("should merge two graphs correctly using weighted_average strategy", () => {
    const graph1: SemanticContextGraph = {
      nodes: [
        { id: "n1", metadata: { score: 0.8 } },
        { id: "n2", metadata: { score: 0.5 } },
      ],
      edges: [
        { id: "e1", source: "n1", target: "n2", metadata: { weight: 0.9 } },
      ],
    };
    const graph2: SemanticContextGraph = {
      nodes: [
        { id: "n2", metadata: { score: 0.6 } },
        { id: "n3", metadata: { score: 0.7 } },
      ],
      edges: [
        { id: "e2", source: "n2", target: "n3", metadata: { weight: 0.8 } },
      ],
    };

    const merger = new SemanticContextGraphMergerV1();
    const mergedGraph = merger.merge(graph1, graph2, "weighted_average");

    expect(mergedGraph.nodes.length).toBe(3);
    expect(mergedGraph.edges.length).toBe(2);

    const n2Node = mergedGraph.nodes.find(n => n.id === "n2");
    expect(n2Node?.metadata.score).toBeCloseTo((0.5 + 0.6) / 2); // Simple average for demonstration, assuming implementation handles this
  });

  it("should merge two graphs correctly using first_seen strategy", () => {
    const graph1: SemanticContextGraph = {
      nodes: [
        { id: "n1", metadata: { value: "A" } },
        { id: "n2", metadata: { value: "B" } },
      ],
      edges: [
        { id: "e1", source: "n1", target: "n2", metadata: { weight: 0.9 } },
      ],
    };
    const graph2: SemanticContextGraph = {
      nodes: [
        { id: "n2", metadata: { value: "C" } }, // Should be ignored in favor of graph1's value
        { id: "n3", metadata: { value: "D" } },
      ],
      edges: [
        { id: "e2", source: "n2", target: "n3", metadata: { weight: 0.8 } },
      ],
    };

    const merger = new SemanticContextGraphMergerV1();
    const mergedGraph = merger.merge(graph1, graph2, "first_seen");

    expect(mergedGraph.nodes.length).toBe(3);
    expect(mergedGraph.edges.length).toBe(2);

    const n2Node = mergedGraph.nodes.find(n => n.id === "n2");
    // In first_seen, n2 from graph1 should persist
    expect(n2Node?.metadata.value).toBe("B");
  });

  it("should handle merging two empty graphs", () => {
    const graph1: SemanticContextGraph = { nodes: [], edges: [] };
    const graph2: SemanticContextGraph = { nodes: [], edges: [] };

    const merger = new SemanticContextGraphMergerV1();
    const mergedGraph = merger.merge(graph1, graph2, "weighted_average");

    expect(mergedGraph.nodes).toEqual([]);
    expect(mergedGraph.edges).toEqual([]);
  });
});