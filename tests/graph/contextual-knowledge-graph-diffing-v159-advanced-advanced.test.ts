import { describe, it, expect } from "vitest";
import {
  ContextualKnowledgeGraphDiffingV159AdvancedAdvanced,
} from "../src/graph/contextual-knowledge-graph-diffing-v159-advanced-advanced";

describe("ContextualKnowledgeGraphDiffingV159AdvancedAdvanced", () => {
  it("should correctly diff two simple knowledge graphs", async () => {
    const graph1 = {
      nodes: [{ id: "A", label: "A" }],
      edges: [{ source: "A", target: "B", type: "knows" }],
    };
    const graph2 = {
      nodes: [{ id: "A", label: "A" }, { id: "B", label: "B" }],
      edges: [{ source: "A", target: "B", type: "knows" }, { source: "A", target: "C", type: "related" }],
    };

    const diff = await ContextualKnowledgeGraphDiffingV159AdvancedAdvanced(graph1, graph2);
    expect(diff).toEqual({
      addedNodes: [{ id: "B", label: "B" }, { id: "C", label: "C" }],
      addedEdges: [{ source: "A", target: "C", type: "related" }],
      removedNodes: [],
      removedEdges: [],
    });
  });

  it("should handle cases where nodes and edges are modified", async () => {
    const graph1 = {
      nodes: [{ id: "A", label: "OldA" }, { id: "B", label: "B" }],
      edges: [{ source: "A", target: "B", type: "knows" }],
    };
    const graph2 = {
      nodes: [{ id: "A", label: "NewA" }, { id: "B", label: "B" }],
      edges: [{ source: "A", target: "B", type: "knows_v2" }],
    };

    const diff = await ContextualKnowledgeGraphDiffingV159AdvancedAdvanced(graph1, graph2);
    expect(diff).toEqual({
      addedNodes: [],
      addedEdges: [{ source: "A", target: "B", type: "knows_v2" }],
      removedNodes: [{ id: "A", label: "OldA" }],
      removedEdges: [{ source: "A", target: "B", type: "knows" }],
    });
  });

  it("should return empty diff when graphs are identical", async () => {
    const graph = {
      nodes: [{ id: "X", label: "X" }, { id: "Y", label: "Y" }],
      edges: [{ source: "X", target: "Y", type: "is" }],
    };

    const diff = await ContextualKnowledgeGraphDiffingV159AdvancedAdvanced(graph, graph);
    expect(diff).toEqual({
      addedNodes: [],
      addedEdges: [],
      removedNodes: [],
      removedEdges: [],
    });
  });
});