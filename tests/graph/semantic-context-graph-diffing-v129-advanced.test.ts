import { describe, it, expect } from "vitest";
import { SemanticContextGraphDiffingV129Advanced } from "../src/graph/semantic-context-graph-diffing-v129-advanced";

describe("SemanticContextGraphDiffingV129Advanced", () => {
  it("should correctly diff two identical graphs", () => {
    const graph1: SemanticGraph = {
      nodes: new Map([
        ["n1", { id: "n1", type: "user", attributes: { text: "Hello" } }],
      ]),
      edges: new Map([
        ["e1", { sourceId: "n1", targetId: "n2", type: "follows", attributes: {} }],
      ]),
    };
    const graph2: SemanticGraph = {
      nodes: new Map([
        ["n1", { id: "n1", type: "user", attributes: { text: "Hello" } }],
        ["n2", { id: "n2", type: "assistant", attributes: {} }],
      ]),
      edges: new Map([
        ["e1", { sourceId: "n1", targetId: "n2", type: "follows", attributes: {} }],
      ]),
    };

    const diff = SemanticContextGraphDiffingV129Advanced.diff(graph1, graph2);
    expect(diff.nodeDiffs).toEqual({});
    expect(diff.edgeDiffs).toEqual({});
  });

  it("should detect changes in node attributes", () => {
    const graph1: SemanticGraph = {
      nodes: new Map([
        ["n1", { id: "n1", type: "user", attributes: { text: "Old text" } }],
      ]),
      edges: new Map(),
    };
    const graph2: SemanticGraph = {
      nodes: new Map([
        ["n1", { id: "n1", type: "user", attributes: { text: "New text" } }],
      ]),
      edges: new Map(),
    };

    const diff = SemanticContextGraphDiffingV129Advanced.diff(graph1, graph2);
    expect(diff.nodeDiffs).toEqual({
      "n1": {
        attributesDiff: {
          path: "text",
          oldValue: "Old text",
          newValue: "New text",
        },
      },
    });
  });

  it("should detect added and removed edges", () => {
    const graph1: SemanticGraph = {
      nodes: new Map([
        ["n1", { id: "n1", type: "user", attributes: {} }],
        ["n2", { id: "n2", type: "assistant", attributes: {} }],
      ]),
      edges: new Map([
        ["e1", { sourceId: "n1", targetId: "n2", type: "follows", attributes: {} }],
      ]),
    };
    const graph2: SemanticGraph = {
      nodes: new Map([
        ["n1", { id: "n1", type: "user", attributes: {} }],
        ["n2", { id: "n2", type: "assistant", attributes: {} }],
      ]),
      edges: new Map([
        ["e1", { sourceId: "n1", targetId: "n2", type: "follows", attributes: {} }],
        ["e2", { sourceId: "n1", targetId: "n2", type: "mentions", attributes: {} }],
      ]),
    };

    const diff = SemanticContextGraphDiffingV129Advanced.diff(graph1, graph2);
    expect(diff.edgeDiffs.added).toHaveLength(1);
    expect(diff.edgeDiffs.removed).toHaveLength(0);
    expect(diff.edgeDiffs.added).toEqual({
      "e2": {
        edge: { sourceId: "n1", targetId: "n2", type: "mentions", attributes: {} },
      },
    });
  });
});