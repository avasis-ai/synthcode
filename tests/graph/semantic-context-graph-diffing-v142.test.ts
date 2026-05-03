import { describe, it, expect } from "vitest";
import { SemanticGraphDiffingV142 } from "../src/graph/semantic-context-graph-diffing-v142";

describe("SemanticGraphDiffingV142", () => {
  it("should calculate a low divergence score for identical graphs", () => {
    const graph1 = {
      nodes: [{ id: "n1", metadata: { name: "A" }, embedding: [0.1] }],
      edges: [{ id: "e1", source: "n1", target: "n1" }]
    };
    const graph2 = {
      nodes: [{ id: "n1", metadata: { name: "A" }, embedding: [0.1] }],
      edges: [{ id: "e1", source: "n1", target: "n1" }]
    };
    const diffing = new SemanticGraphDiffingV142();
    const diff = diffing.diff(graph1, graph2);
    expect(diff.divergenceScore).toBeCloseTo(0);
  });

  it("should detect changes in node metadata and embedding similarity", () => {
    const graph1 = {
      nodes: [{ id: "n1", metadata: { name: "A" }, embedding: [0.1] }],
      edges: []
    };
    const graph2 = {
      nodes: [{ id: "n1", metadata: { name: "B" }, embedding: [0.2] }],
      edges: []
    };
    const diffing = new SemanticGraphDiffingV142();
    const diff = diffing.diff(graph1, graph2);

    expect(diff.nodeChanges).toHaveLength(1);
    const nodeChange = diff.nodeChanges[0];
    expect(nodeChange.nodeId).toBe("n1");
    expect(nodeChange.differences).toHaveLength(1);
    expect(nodeChange.differences[0].field).toBe("name");
    expect(nodeChange.differences[0].oldValue).toBe("A");
    expect(nodeChange.differences[0].newValue).toBe("B");
    expect(nodeChange.embeddingSimilarity).toBeLessThan(0.9);
  });

  it("should detect added and removed edges", () => {
    const graph1 = {
      nodes: [{ id: "n1", metadata: { name: "A" }, embedding: [0.1] }],
      edges: [{ id: "e1", source: "n1", target: "n1" }]
    };
    const graph2 = {
      nodes: [{ id: "n1", metadata: { name: "A" }, embedding: [0.1] }],
      edges: [{ id: "e2", source: "n1", target: "n1" }]
    };
    const diffing = new SemanticGraphDiffingV142();
    const diff = diffing.diff(graph1, graph2);

    expect(diff.edgeChanges).toHaveLength(1);
    const edgeChange = diff.edgeChanges[0];
    expect(edgeChange.edgeId).toBe("e2");
    expect(edgeChange.sourceId).toBe("n1");
    expect(edgeChange.targetId).toBe("n1");
  });
});