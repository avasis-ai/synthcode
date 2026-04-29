import { describe, it, expect } from "vitest";
import { DependencyGraphData } from "../src/visualization/contextual-dependency-graph-visualizer-v158";

describe("DependencyGraphData structure", () => {
  it("should correctly structure nodes and edges", () => {
    const data: DependencyGraphData = {
      nodes: {
        "node1": { id: "node1", label: "Concept A", type: "concept" },
        "node2": { id: "node2", label: "Concept B", type: "concept" },
      },
      edges: [
        {
          sourceId: "node1",
          targetId: "node2",
          relationshipType: "semantic_similarity",
          score: 0.9,
          description: "High similarity between A and B",
        },
      ],
    };

    expect(data.nodes).toBeDefined();
    expect(data.edges).toBeInstanceOf(Array);
    expect(data.nodes["node1"]).toBeDefined();
    expect(data.edges.length).toBe(1);
  });

  it("should handle an empty graph", () => {
    const data: DependencyGraphData = {
      nodes: {},
      edges: [],
    };

    expect(data.nodes).toEqual({});
    expect(data.edges).toEqual([]);
  });

  it("should validate relationship types in edges", () => {
    const validEdge: any = {
      sourceId: "n1",
      targetId: "n2",
      relationshipType: "conceptual_gap",
      score: 0.5,
      description: "A gap exists",
    };

    const data: DependencyGraphData = {
      nodes: { "n1": { id: "n1", label: "A", type: "c" }, "n2": { id: "n2", label: "B", type: "c" } },
      edges: [validEdge],
    };

    expect(validEdge.relationshipType).toBe("conceptual_gap");
    expect(["semantic_similarity", "conceptual_gap", "redundancy"]).toContain(validEdge.relationshipType);
  });
});