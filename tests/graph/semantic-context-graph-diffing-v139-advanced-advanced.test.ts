import { describe, it, expect } from "vitest";
import { SemanticContextGraph, GraphNode, GraphEdge, DiffResult } from "../src/graph/semantic-context-graph-diffing-v139-advanced-advanced";

describe("SemanticContextGraphDiffing", () => {
  it("should correctly diff two identical graphs", () => {
    const graph1: SemanticContextGraph = {
      nodes: new Set([
        { id: "n1", type: "user", attributes: { text: "hi" } } as GraphNode,
        { id: "n2", type: "assistant", attributes: { text: "hello" } } as GraphNode,
      ]),
      edges: new Set([
        { sourceId: "n1", targetId: "n2", type: "responds_to", attributes: {} } as GraphEdge,
      ]),
    };
    const graph2: SemanticContextGraph = {
      nodes: new Set([
        { id: "n1", type: "user", attributes: { text: "hi" } } as GraphNode,
        { id: "n2", type: "assistant", attributes: { text: "hello" } } as GraphNode,
      ]),
      edges: new Set([
        { sourceId: "n1", targetId: "n2", type: "responds_to", attributes: {} } as GraphEdge,
      ]),
    };

    const diff = SemanticContextGraph.diff(graph1, graph2);
    expect(diff.deletedNodes.size).toBe(0);
    expect(diff.addedNodes.size).toBe(0);
    expect(diff.updatedNodes.size).toBe(0);
    expect(diff.deletedEdges.size).toBe(0);
    expect(diff.addedEdges.size).toBe(0);
    expect(diff.updatedEdges.size).toBe(0);
  });

  it("should detect added and removed nodes and edges", () => {
    const graph1: SemanticContextGraph = {
      nodes: new Set([
        { id: "n1", type: "user", attributes: { text: "hi" } } as GraphNode,
      ]),
      edges: new Set([
        { sourceId: "n1", targetId: "n2", type: "responds_to", attributes: {} } as GraphEdge,
      ]),
    };
    const graph2: SemanticContextGraph = {
      nodes: new Set([
        { id: "n1", type: "user", attributes: { text: "hi" } } as GraphNode,
        { id: "n3", type: "tool", attributes: { name: "search" } } as GraphNode,
      ]),
      edges: new Set([
        { sourceId: "n1", targetId: "n2", type: "responds_to", attributes: {} } as GraphEdge,
        { sourceId: "n1", targetId: "n3", type: "uses", attributes: {} } as GraphEdge,
      ]),
    };

    const diff = SemanticContextGraph.diff(graph1, graph2);
    expect(diff.deletedNodes.size).toBe(0);
    expect(diff.addedNodes.size).toBe(1);
    expect(diff.updatedNodes.size).toBe(0);
    expect(diff.deletedEdges.size).toBe(1);
    expect(diff.addedEdges.size).toBe(1);
    expect(diff.updatedEdges.size).toBe(0);
  });

  it("should detect updated attributes on existing nodes and edges", () => {
    const graph1: SemanticContextGraph = {
      nodes: new Set([
        { id: "n1", type: "user", attributes: { text: "hi" } } as GraphNode,
        { id: "n2", type: "assistant", attributes: { text: "hello" } } as GraphNode,
      ]),
      edges: new Set([
        { sourceId: "n1", targetId: "n2", type: "responds_to", attributes: {} } as GraphEdge,
      ]),
    };
    const graph2: SemanticContextGraph = {
      nodes: new Set([
        { id: "n1", type: "user", attributes: { text: "hi world" } } as GraphNode,
        { id: "n2", type: "assistant", attributes: { text: "hello" } } as GraphNode,
      ]),
      edges: new Set([
        { sourceId: "n1", targetId: "n2", type: "responds_to", attributes: { confidence: 0.9 } } as GraphEdge,
      ]),
    };

    const diff = SemanticContextGraph.diff(graph1, graph2);
    expect(diff.deletedNodes.size).toBe(0);
    expect(diff.addedNodes.size).toBe(0);
    expect(diff.updatedNodes.size).toBe(1);
    expect(diff.deletedEdges.size).toBe(0);
    expect(diff.addedEdges.size).toBe(0);
    expect(diff.updatedEdges.size).toBe(1);
  });
});