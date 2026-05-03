import { describe, it, expect } from "vitest";
import { mergeSemanticContextGraph } from "../src/schema/semantic-context-graph-merger-v1001-advanced";

describe("mergeSemanticContextGraph", () => {
  it("should correctly merge two graphs with no conflicts", () => {
    const graph1 = {
      nodes: [
        { id: "n1", type: "user", attributes: { source: "user" }, content: "Hello" },
        { id: "n2", type: "assistant", attributes: { source: "assistant" }, content: "Hi there" },
      ],
      edges: [
        { from: "n1", to: "n2", type: "responds_to", weight: 1.0, attributes: {} },
      ],
    };
    const graph2 = {
      nodes: [
        { id: "n3", type: "tool", attributes: { source: "tool" }, content: "Tool output" },
      ],
      edges: [
        { from: "n2", to: "n3", type: "uses", weight: 0.8, attributes: {} },
      ],
    };

    const mergedGraph = mergeSemanticContextGraph(graph1, graph2);

    expect(mergedGraph.nodes).toHaveLength(3);
    expect(mergedGraph.edges).toHaveLength(2);
    expect(mergedGraph.nodes.some(n => n.id === "n3" && n.type === "tool")).toBe(true);
  });

  it("should resolve conflicts for node attributes by preferring the second graph's value", () => {
    const graph1 = {
      nodes: [
        { id: "n1", type: "user", attributes: { source: "user", version: "v1" }, content: "Initial message" },
      ],
      edges: [],
    };
    const graph2 = {
      nodes: [
        { id: "n1", type: "user", attributes: { source: "user", version: "v2" }, content: "Updated message" },
      ],
      edges: [],
    };

    const mergedGraph = mergeSemanticContextGraph(graph1, graph2);

    const mergedNode = mergedGraph.nodes.find(n => n.id === "n1");
    expect(mergedNode).toBeDefined();
    expect(mergedNode?.attributes.version).toBe("v2");
    expect(mergedNode?.content).toBe("Updated message");
  });

  it("should report conflicts for edges when weights differ", () => {
    const graph1 = {
      nodes: [
        { id: "n1", type: "user", attributes: {}, content: "" },
        { id: "n2", type: "assistant", attributes: {}, content: "" },
      ],
      edges: [
        { from: "n1", to: "n2", type: "responds_to", weight: 1.0, attributes: {} },
      ],
    };
    const graph2 = {
      nodes: [
        { id: "n1", type: "user", attributes: {}, content: "" },
        { id: "n2", type: "assistant", attributes: {}, content: "" },
      ],
      edges: [
        { from: "n1", to: "n2", type: "responds_to", weight: 0.5, attributes: {} },
      ],
    };

    const mergedGraph = mergeSemanticContextGraph(graph1, graph2);
    const report = mergeSemanticContextGraph(graph1, graph2).report;

    expect(report).toHaveLength(1);
    expect(report[0].elementType).toBe("edge");
    expect(report[0].elementId).toBe("n1->n2:responds_to");
    expect(report[0].conflictingValues).toEqual([1.0, 0.5]);
  });
});