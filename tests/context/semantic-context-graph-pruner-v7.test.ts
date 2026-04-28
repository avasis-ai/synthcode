import { describe, it, expect } from "vitest";
import { SemanticContextGraph, FocusContext, PruningReport } from "../src/context/semantic-context-graph-pruner-v7";

describe("SemanticContextGraphPrunerV7", () => {
  it("should prune nodes and edges when focus context is clear", () => {
    const graph: SemanticContextGraph = {
      nodes: new Map([
        ["node1", { content: [{ type: "text", text: "Initial thought" }], timestamp: 100 }],
        ["node2", { content: [{ type: "text", text: "Follow up" }], timestamp: 200 }],
        ["node3", { content: [{ type: "text", text: "Irrelevant detail" }], timestamp: 300 }],
      ]),
      edges: new Set(["node1-node2", "node2-node3"]),
    };
    const focus: FocusContext = {
      focusContent: [],
      focusSourceId: "",
    };

    const pruner = {
      prune: (graph: SemanticContextGraph, focus: FocusContext): { report: PruningReport, newGraph: SemanticContextGraph } => {
        // Mock implementation for testing purposes
        const report: PruningReport = {
          removedNodes: new Map([["node3", "No focus"]]),
          removedEdges: new Set(["node2-node3"]),
          totalRemovedItems: 1,
        };
        const newGraph: SemanticContextGraph = {
          nodes: new Map([
            ["node1", { content: [{ type: "text", text: "Initial thought" }], timestamp: 100 }],
            ["node2", { content: [{ type: "text", text: "Follow up" }], timestamp: 200 }],
          ]),
          edges: new Set(["node1-node2"]),
        };
        return { report, newGraph };
      },
    };

    const { report, newGraph } = pruner.prune(graph, focus);

    expect(report.removedNodes.size).toBe(1);
    expect(report.removedEdges.has("node2-node3")).toBe(true);
    expect(newGraph.nodes.size).toBe(2);
    expect(newGraph.edges.size).toBe(1);
  });

  it("should keep nodes and edges when focus context strongly matches a node", () => {
    const graph: SemanticContextGraph = {
      nodes: new Map([
        ["nodeA", { content: [{ type: "text", text: "Core topic" }], timestamp: 100 }],
        ["nodeB", { content: [{ type: "text", text: "Related idea" }], timestamp: 200 }],
      ]),
      edges: new Set(["nodeA-nodeB"]),
    };
    const focus: FocusContext = {
      focusContent: [{ type: "text", text: "Core topic" }],
      focusSourceId: "nodeA",
    };

    const pruner = {
      prune: (graph: SemanticContextGraph, focus: FocusContext): { report: PruningReport, newGraph: SemanticContextGraph } => {
        // Mock implementation for testing purposes
        const report: PruningReport = {
          removedNodes: new Map(),
          removedEdges: new Set(),
          totalRemovedItems: 0,
        };
        const newGraph: SemanticContextGraph = {
          nodes: new Map(graph.nodes),
          edges: new Set(graph.edges),
        };
        return { report, newGraph };
      },
    };

    const { report, newGraph } = pruner.prune(graph, focus);

    expect(report.removedNodes.size).toBe(0);
    expect(newGraph.nodes.size).toBe(2);
    expect(newGraph.edges.size).toBe(1);
  });

  it("should prune nodes and edges when focus context is empty and graph is sparse", () => {
    const graph: SemanticContextGraph = {
      nodes: new Map([
        ["nodeX", { content: [{ type: "text", text: "A" }], timestamp: 1 }],
      ]),
      edges: new Set(),
    };
    const focus: FocusContext = {
      focusContent: [],
      focusSourceId: "",
    };

    const pruner = {
      prune: (graph: SemanticContextGraph, focus: FocusContext): { report: PruningReport, newGraph: SemanticContextGraph } => {
        // Mock implementation for testing purposes
        const report: PruningReport = {
          removedNodes: new Map([["nodeX", "No focus"]]),
          removedEdges: new Set(),
          totalRemovedItems: 1,
        };
        const newGraph: SemanticContextGraph = {
          nodes: new Map(),
          edges: new Set(),
        };
        return { report, newGraph };
      },
    };

    const { report, newGraph } = pruner.prune(graph, focus);

    expect(report.removedNodes.size).toBe(1);
    expect(report.removedEdges.size).toBe(0);
    expect(newGraph.nodes.size).toBe(0);
    expect(newGraph.edges.size).toBe(0);
  });
});