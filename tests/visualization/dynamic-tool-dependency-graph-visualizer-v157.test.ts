import { describe, it, expect } from "vitest";
import { GraphPayload } from "../src/visualization/dynamic-tool-dependency-graph-visualizer-v157";

describe("GraphPayload structure", () => {
  it("should correctly define the structure for nodes", () => {
    const payload: GraphPayload = {
      nodes: {
        "toolA": {
          label: "Tool A",
          type: "tool",
          details: { version: "1.0" },
        },
        "capB": {
          label: "Capability B",
          type: "capability",
          details: { required: true },
        },
      },
      edges: [],
    };
    expect(payload.nodes).toBeDefined();
    expect(payload.nodes["toolA"]).toEqual({
      label: "Tool A",
      type: "tool",
      details: { version: "1.0" },
    });
    expect(payload.nodes["capB"]).toEqual({
      label: "Capability B",
      type: "capability",
      details: { required: true },
    });
  });

  it("should correctly define the structure for edges", () => {
    const payload: GraphPayload = {
      nodes: {},
      edges: [
        {
          sourceId: "toolA",
          targetId: "capB",
          type: "tool_call",
          details: { reason: "to use capability B" },
        },
        {
          sourceId: "capB",
          targetId: "toolA",
          type: "capability_req",
          details: { priority: "high" },
        },
      ],
    };
    expect(payload.edges).toBeInstanceOf(Array);
    expect(payload.edges.length).toBe(2);
    expect(payload.edges[0].type).toBe("tool_call");
    expect(payload.edges[1].sourceId).toBe("capB");
  });

  it("should handle an empty graph payload", () => {
    const payload: GraphPayload = {
      nodes: {},
      edges: [],
    };
    expect(payload.nodes).toEqual({});
    expect(payload.edges).toEqual([]);
  });
});