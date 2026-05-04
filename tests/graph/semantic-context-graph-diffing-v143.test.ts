import { describe, it, expect } from "vitest";
import { diffSemanticContextGraph } from "../src/graph/semantic-context-graph-diffing-v143";

describe("diffSemanticContextGraph", () => {
  it("should return an empty diff when graphs are identical", () => {
    const graph = {
      nodes: {
        "node1": {
          id: "node1",
          type: "message",
          properties: { content: "Hello" },
          embedding: new Float32Array([0.1, 0.2]),
        },
      },
      edges: {
        "edge1": {
          id: "edge1",
          source: "node1",
          target: "node1",
          type: "related",
          properties: {},
          embedding: new Float32Array([0.3, 0.4]),
        },
      },
    };
    const diff = diffSemanticContextGraph(graph, graph);
    expect(diff).toEqual({ nodes: {}, edges: {} });
  });

  it("should detect added nodes and edges", () => {
    const originalGraph = {
      nodes: {
        "node1": {
          id: "node1",
          type: "message",
          properties: { content: "Hello" },
          embedding: new Float32Array([0.1, 0.2]),
        },
      },
      edges: {
        "edge1": {
          id: "edge1",
          source: "node1",
          target: "node1",
          type: "related",
          properties: {},
          embedding: new Float32Array([0.3, 0.4]),
        },
      },
    };
    const updatedGraph = {
      nodes: {
        ...originalGraph.nodes,
        "node2": {
          id: "node2",
          type: "message",
          properties: { content: "World" },
          embedding: new Float32Array([0.5, 0.6]),
        },
      },
      edges: {
        ...originalGraph.edges,
        "edge2": {
          id: "edge2",
          source: "node1",
          target: "node2",
          type: "follows",
          properties: {},
          embedding: new Float32Array([0.7, 0.8]),
        },
      },
    };
    const diff = diffSemanticContextGraph(originalGraph, updatedGraph);
    expect(diff.nodes).toHaveProperty("node2");
    expect(diff.edges).toHaveProperty("edge2");
  });

  it("should detect removed nodes and edges", () => {
    const originalGraph = {
      nodes: {
        "node1": {
          id: "node1",
          type: "message",
          properties: { content: "Hello" },
          embedding: new Float32Array([0.1, 0.2]),
        },
        "nodeToRemove": {
          id: "nodeToRemove",
          type: "message",
          properties: { content: "Old content" },
          embedding: new Float32Array([0.9, 0.8]),
        },
      },
      edges: {
        "edge1": {
          id: "edge1",
          source: "node1",
          target: "node1",
          type: "related",
          properties: {},
          embedding: new Float32Array([0.3, 0.4]),
        },
        "edgeToRemove": {
          id: "edgeToRemove",
          source: "node1",
          target: "nodeToRemove",
          type: "links",
          properties: {},
          embedding: new Float32Array([0.1, 0.2]),
        },
      },
    };
    const updatedGraph = {
      nodes: {
        "node1": {
          id: "node1",
          type: "message",
          properties: { content: "Hello" },
          embedding: new Float32Array([0.1, 0.2]),
        },
      },
      edges: {
        "edge1": {
          id: "edge1",
          source: "node1",
          target: "node1",
          type: "related",
          properties: {},
          embedding: new Float32Array([0.3, 0.4]),
        },
      },
    };
    const diff = diffSemanticContextGraph(originalGraph, updatedGraph);
    expect(diff.nodes).toHaveProperty("nodeToRemove");
    expect(diff.edges).toHaveProperty("edgeToRemove");
  });
});