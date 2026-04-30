import { describe, it, expect } from "vitest";
import { GraphPayload } from "../src/visualization/dynamic-capability-graph-visualizer";
import { createGraphPayload } from "../src/visualization/dynamic-capability-graph-visualizer";

describe("createGraphPayload", () => {
  it("should create a basic graph payload with nodes and edges", () => {
    const nodes = [
      { name: "A", description: "Desc A", metadata: {} },
      { name: "B", description: "Desc B", metadata: {} },
    ];
    const edges = [
      { source: "A", target: "B", type: "supports" },
    ];
    const payload = createGraphPayload({ nodes, edges });

    expect(payload).toBeDefined();
    expect(payload?.nodes).toHaveLength(2);
    expect(payload?.edges).toHaveLength(1);
    expect(payload?.nodes[0].name).toBe("A");
    expect(payload?.edges[0].source).toBe("A");
  });

  it("should handle empty inputs gracefully", () => {
    const payload = createGraphPayload({ nodes: [], edges: [] });

    expect(payload).toBeDefined();
    expect(payload?.nodes).toHaveLength(0);
    expect(payload?.edges).toHaveLength(0);
  });

  it("should correctly process nodes with metadata", () => {
    const nodes = [
      { name: "C", description: "Desc C", metadata: { version: "1.0" } },
    ];
    const edges = [];
    const payload = createGraphPayload({ nodes, edges });

    expect(payload?.nodes).toHaveLength(1);
    expect(payload?.nodes[0].metadata).toEqual({ version: "1.0" });
  });
});