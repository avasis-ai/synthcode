import { describe, it, expect } from "vitest";
import { DependencyGraphPayload } from "../src/visualization/tool-capability-dependency-graph-visualizer-v141";

describe("DependencyGraphPayload", () => {
  it("should correctly structure a basic payload with nodes and edges", () => {
    const payload: DependencyGraphPayload = {
      nodes: [
        {
          id: "nodeA",
          name: "Node A",
          description: "Description A",
          metadata: { version: "1.0" },
          compatibilityScore: 0.9,
        },
        {
          id: "nodeB",
          name: "Node B",
          description: "Description B",
          metadata: {},
          compatibilityScore: 0.5,
        },
      ],
      edges: [
        {
          from: "nodeA",
          to: "nodeB",
          type: "requires",
          weight: 0.8,
          metadata: { reason: "A needs B" },
        },
      ],
    };

    expect(payload.nodes).toHaveLength(2);
    expect(payload.edges).toHaveLength(1);
    expect(payload.nodes[0].id).toBe("nodeA");
    expect(payload.edges[0].from).toBe("nodeA");
  });

  it("should handle an empty payload gracefully", () => {
    const payload: DependencyGraphPayload = {
      nodes: [],
      edges: [],
    };

    expect(payload.nodes).toEqual([]);
    expect(payload.edges).toEqual([]);
  });

  it("should correctly type check node and edge properties", () => {
    const payload: DependencyGraphPayload = {
      nodes: [
        {
          id: "testId",
          name: "Test Node",
          description: "Test Desc",
          metadata: { key: "value" },
          compatibilityScore: 1.0,
        } as any, // Casting for test simplicity
      ],
      edges: [
        {
          from: "testId",
          to: "testId",
          type: "uses",
          weight: 1.0,
          metadata: {},
        } as any, // Casting for test simplicity
      ],
    };

    expect(typeof payload.nodes[0].id).toBe("string");
    expect(typeof payload.edges[0].weight).toBe("number");
    expect(["requires", "uses", "flows_to"]).toContain(payload.edges[0].type);
  });
});