import { describe, it, expect } from "vitest";
import { CausalStateDiffPayload } from "../context/contextual-state-diffing-v139";

describe("CausalStateDiffPayload", () => {
  it("should correctly structure the payload with nodes and edges", () => {
    const payload: CausalStateDiffPayload = {
      nodes: [
        { id: "node1", state: { count: 1 }, timestamp: 100, dependencies: [] },
        { id: "node2", state: { value: "A" }, timestamp: 200, dependencies: ["node1"] },
      ],
      edges: [
        { fromNodeId: "node1", toNodeId: "node2", causalWeight: 0.5, timestamp: 201 },
      ],
    };

    expect(payload.nodes).toHaveLength(2);
    expect(payload.edges).toHaveLength(1);
    expect(payload.nodes[0].id).toBe("node1");
    expect(payload.edges[0].fromNodeId).toBe("node1");
  });

  it("should handle an empty payload gracefully", () => {
    const payload: CausalStateDiffPayload = {
      nodes: [],
      edges: [],
    };

    expect(payload.nodes).toEqual([]);
    expect(payload.edges).toEqual([]);
  });

  it("should correctly include nodes with multiple dependencies", () => {
    const payload: CausalStateDiffPayload = {
      nodes: [
        { id: "nodeA", state: {}, timestamp: 1, dependencies: ["dep1", "dep2"] },
      ],
      edges: [],
    };

    expect(payload.nodes[0].id).toBe("nodeA");
    expect(payload.nodes[0].dependencies).toEqual(["dep1", "dep2"]);
  });
});