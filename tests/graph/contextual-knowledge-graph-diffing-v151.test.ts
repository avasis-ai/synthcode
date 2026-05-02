import { describe, it, expect } from "vitest";
import {
  ContextualKnowledgeGraphDiffingV151,
} from "../src/graph/contextual-knowledge-graph-diffing-v151";

describe("ContextualKnowledgeGraphDiffingV151", () => {
  it("should correctly diff two simple knowledge graphs", async () => {
    const graph1 = {
      nodes: [{ id: "A", label: "A" }],
      edges: [{ source: "A", target: "B", type: "knows" }],
    };
    const graph2 = {
      nodes: [{ id: "A", label: "A" }, { id: "B", label: "B" }],
      edges: [{ source: "A", target: "B", type: "knows" }, { source: "B", target: "C", type: "related" }],
    };

    const diff = await ContextualKnowledgeGraphDiffingV151.diff(graph1, graph2);

    expect(diff.added_nodes).toHaveLength(1);
    expect(diff.added_edges).toHaveLength(1);
    expect(diff.removed_nodes).toHaveLength(0);
    expect(diff.removed_edges).toHaveLength(0);
  });

  it("should detect node and edge removals", async () => {
    const graph1 = {
      nodes: [{ id: "A", label: "A" }, { id: "B", label: "B" }],
      edges: [{ source: "A", target: "B", type: "knows" }],
    };
    const graph2 = {
      nodes: [{ id: "A", label: "A" }],
      edges: [],
    };

    const diff = await ContextualKnowledgeGraphDiffingV151.diff(graph1, graph2);

    expect(diff.added_nodes).toHaveLength(0);
    expect(diff.added_edges).toHaveLength(0);
    expect(diff.removed_nodes).toHaveLength(1);
    expect(diff.removed_edges).toHaveLength(1);
  });

  it("should handle identical graphs resulting in no changes", async () => {
    const graph = {
      nodes: [{ id: "A", label: "A" }, { id: "B", label: "B" }],
      edges: [{ source: "A", target: "B", type: "knows" }],
    };

    const diff = await ContextualKnowledgeGraphDiffingV151.diff(graph, graph);

    expect(diff.added_nodes).toHaveLength(0);
    expect(diff.added_edges).toHaveLength(0);
    expect(diff.removed_nodes).toHaveLength(0);
    expect(diff.removed_edges).toHaveLength(0);
  });
});