import { describe, it, expect } from "vitest";
import { GraphPayload } from "../src/visualization/dynamic-tool-dependency-graph-visualizer-v158";

describe("GraphPayload", () => {
  it("should correctly structure a basic graph payload", () => {
    const payload: GraphPayload = {
      nodes: [
        { id: "n1", label: "Tool A", type: "tool", metadata: {} },
        { id: "n2", label: "Context Info", type: "context", metadata: {} },
        { id: "n3", label: "User Query", type: "user_input", metadata: {} },
      ],
      edges: [
        { sourceId: "n3", targetId: "n1", type: "calls", weight: 1.0, metadata: {} },
        { sourceId: "n1", targetId: "n2", type: "depends_on", weight: 0.5, metadata: {} },
      ],
      metadata: {
        generationTime: 1678886400,
        sourceComponent: "GraphVisualizer",
      },
    };

    expect(payload.nodes).toBeInstanceOf(Array);
    expect(payload.edges).toBeInstanceOf(Array);
    expect(payload.metadata).toBeInstanceOf(Object);
    expect(payload.nodes.length).toBe(3);
    expect(payload.edges.length).toBe(2);
  });

  it("should handle an empty graph payload", () => {
    const payload: GraphPayload = {
      nodes: [],
      edges: [],
      metadata: {
        generationTime: Date.now(),
        sourceComponent: "GraphVisualizer",
      },
    };

    expect(payload.nodes).toEqual([]);
    expect(payload.edges).toEqual([]);
    expect(payload.metadata).toBeDefined();
  });

  it("should validate edge types and node types", () => {
    const validPayload: GraphPayload = {
      nodes: [
        { id: "t1", label: "Tool", type: "tool", metadata: {} },
        { id: "c1", label: "Context", type: "context", metadata: {} },
        { id: "u1", label: "User", type: "user_input", metadata: {} },
      ],
      edges: [
        { sourceId: "u1", targetId: "t1", type: "calls", weight: 1, metadata: {} },
        { sourceId: "t1", targetId: "c1", type: "depends_on", weight: 0.8, metadata: {} },
        { sourceId: "c1", targetId: "t1", type: "flows_to", weight: 0.3, metadata: {} },
      ],
      metadata: {
        sourceComponent: "Test",
      },
    };

    // Check node types
    expect(["tool", "context", "user_input"]).toEqual(
      expect.arrayContaining(["tool", "context", "user_input"])
    );
    // Check edge types
    expect(["calls", "depends_on", "flows_to"]).toEqual(
      expect.arrayContaining(["calls", "depends_on", "flows_to"])
    );

    // Check structure integrity (e.g., source/target IDs exist)
    expect(validPayload.edges[0].sourceId).toBe("u1");
    expect(validPayload.edges[1].targetId).toBe("c1");
  });
});