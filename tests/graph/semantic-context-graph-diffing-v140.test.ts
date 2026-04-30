import { describe, it, expect } from "vitest";
import { SemanticContextGraphDiffingV140 } from "../src/graph/semantic-context-graph-diffing-v140";

describe("SemanticContextGraphDiffingV140", () => {
  it("should correctly diff two identical graphs", () => {
    const graph1: SemanticGraph = {
      nodes: {
        "node1": { id: "node1", type: "user", payload: { text: "Hello" } },
        "node2": { id: "node2", type: "assistant", payload: { text: "Hi there" } },
      },
      edges: [
        { from: "node1", to: "node2", type: "reply_to", payload: {} },
      ],
    };
    const graph2: SemanticGraph = {
      nodes: {
        "node1": { id: "node1", type: "user", payload: { text: "Hello" } },
        "node2": { id: "node2", type: "assistant", payload: { text: "Hi there" } },
      },
      edges: [
        { from: "node1", to: "node2", type: "reply_to", payload: {} },
      ],
    };

    const diff = SemanticContextGraphDiffingV140.diff(graph1, graph2);
    expect(diff).toEqual({ addedNodes: [], removedNodes: [], addedEdges: [], removedEdges: [] });
  });

  it("should detect added nodes and edges", () => {
    const graph1: SemanticGraph = {
      nodes: {
        "node1": { id: "node1", type: "user", payload: { text: "Hello" } },
      },
      edges: [
        { from: "node1", to: "node2", type: "reply_to", payload: {} },
      ],
    };
    const graph2: SemanticGraph = {
      nodes: {
        "node1": { id: "node1", type: "user", payload: { text: "Hello" } },
        "node2": { id: "node2", type: "assistant", payload: { text: "Hi there" } },
      },
      edges: [
        { from: "node1", to: "node2", type: "reply_to", payload: {} },
        { from: "node2", to: "node3", type: "follow_up", payload: {} },
      ],
    };

    const diff = SemanticContextGraphDiffingV140.diff(graph1, graph2);
    expect(diff.addedNodes).toHaveLength(1);
    expect(diff.addedNodes).toContainEqual({ id: "node2", type: "assistant", payload: { text: "Hi there" } });
    expect(diff.addedEdges).toHaveLength(1);
    expect(diff.addedEdges).toContainEqual({ from: "node2", to: "node3", type: "follow_up", payload: {} });
  });

  it("should detect removed nodes and edges", () => {
    const graph1: SemanticGraph = {
      nodes: {
        "node1": { id: "node1", type: "user", payload: { text: "Hello" } },
        "node2": { id: "node2", type: "assistant", payload: { text: "Hi there" } },
      },
      edges: [
        { from: "node1", to: "node2", type: "reply_to", payload: {} },
        { from: "node2", to: "node3", type: "follow_up", payload: {} },
      ],
    };
    const graph2: SemanticGraph = {
      nodes: {
        "node1": { id: "node1", type: "user", payload: { text: "Hello" } },
      },
      edges: [
        { from: "node1", to: "node2", type: "reply_to", payload: {} },
      ],
    };

    const diff = SemanticContextGraphDiffingV140.diff(graph1, graph2);
    expect(diff.removedNodes).toHaveLength(1);
    expect(diff.removedNodes).toContainEqual({ id: "node2", type: "assistant", payload: { text: "Hi there" } });
    expect(diff.removedEdges).toHaveLength(1);
    expect(diff.removedEdges).toContainEqual({ from: "node2", to: "node3", type: "follow_up", payload: {} });
  });
});