import { describe, it, expect } from "vitest";
import { ContextGraphMergerV10 } from "../src/schema/semantic-context-graph-merger-v10";

describe("ContextGraphMergerV10", () => {
  it("should merge two graphs with overlapping nodes and edges correctly", () => {
    const graph1: ContextGraph = {
      nodes: [
        { id: "A", type: "text", content: { text: "Hello" }, related_nodes: ["B"] },
        { id: "B", type: "tool", content: { tool_name: "search" }, related_nodes: [] },
      ],
      edges: [
        { source: "A", target: "B", type: "uses", weight: 0.8, description: "A uses B" },
      ],
    };

    const graph2: ContextGraph = {
      nodes: [
        { id: "B", type: "tool", content: { tool_name: "search" }, related_nodes: ["C"] },
        { id: "C", type: "text", content: { text: "World" }, related_nodes: [] },
      ],
      edges: [
        { source: "B", target: "C", type: "follows", weight: 0.9, description: "B follows C" },
      ],
    };

    const merger = new ContextGraphMergerV10();
    const report = merger.merge(graph1, graph2);

    expect(report.merged).toBe(true);
    expect(report.updated_graph.nodes.length).toBe(3); // A, B, C
    expect(report.updated_graph.edges.length).toBe(2); // (A, B) and (B, C)
    expect(report.updated_graph.nodes.some(n => n.id === "A" && n.content.text === "Hello")).toBe(true);
    expect(report.updated_graph.nodes.some(n => n.id === "C" && n.content.text === "World")).toBe(true);
  });

  it("should handle merging graphs with no common elements", () => {
    const graph1: ContextGraph = {
      nodes: [
        { id: "A", type: "text", content: { text: "Graph 1 Start" }, related_nodes: [] },
      ],
      edges: [
        { source: "A", target: "X", type: "links", weight: 0.5, description: "Link 1" },
      ],
    };

    const graph2: ContextGraph = {
      nodes: [
        { id: "Y", type: "text", content: { text: "Graph 2 Start" }, related_nodes: [] },
      ],
      edges: [
        { source: "Y", target: "Z", type: "links", weight: 0.5, description: "Link 2" },
      ],
    };

    const merger = new ContextGraphMergerV10();
    const report = merger.merge(graph1, graph2);

    expect(report.merged).toBe(false);
    expect(report.updated_graph.nodes.length).toBe(2);
    expect(report.updated_graph.edges.length).toBe(2);
  });

  it("should correctly update node content when merging", () => {
    const graph1: ContextGraph = {
      nodes: [
        { id: "X", type: "text", content: { text: "Initial context." }, related_nodes: [] },
      ],
      edges: [],
    };

    const graph2: ContextGraph = {
      nodes: [
        { id: "X", type: "text", content: { text: "Updated context." }, related_nodes: [] },
      ],
      edges: [],
    };

    const merger = new ContextGraphMergerV10();
    const report = merger.merge(graph1, graph2);

    expect(report.merged).toBe(true);
    const mergedNode = report.updated_graph.nodes.find(n => n.id === "X");
    expect(mergedNode).toBeDefined();
    // Assuming the merger prioritizes or combines content, here we check for the update
    expect(mergedNode?.content.text).toContain("Updated context");
  });
});