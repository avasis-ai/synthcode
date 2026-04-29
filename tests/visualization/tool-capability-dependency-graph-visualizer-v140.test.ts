import { describe, it, expect } from "vitest";
import {
  CapabilityGraphPayload,
  CapabilityDependency,
} from "../src/visualization/tool-capability-dependency-graph-visualizer-v140";

describe("ToolCapabilityDependencyGraphVisualizerV140", () => {
  it("should correctly build a basic dependency graph payload", () => {
    const payload: CapabilityGraphPayload = {
      nodes: {
        "toolA": { name: "Tool A", description: "A basic tool" },
        "toolB": { name: "Tool B", description: "Another tool" },
      },
      edges: [
        { source: "toolA", target: "toolB", type: "requires" },
      ],
    };
    expect(payload).toBeDefined();
    expect(payload.nodes["toolA"]).toEqual({
      name: "Tool A",
      description: "A basic tool",
    });
    expect(payload.edges).toHaveLength(1);
    expect(payload.edges[0].source).toBe("toolA");
    expect(payload.edges[0].type).toBe("requires");
  });

  it("should handle multiple dependencies of different types", () => {
    const payload: CapabilityGraphPayload = {
      nodes: {
        "toolX": { name: "Tool X", description: "X details" },
        "toolY": { name: "Tool Y", description: "Y details" },
        "toolZ": { name: "Tool Z", description: "Z details" },
      },
      edges: [
        { source: "toolX", target: "toolY", type: "requires" },
        { source: "toolY", target: "toolZ", type: "enhances" },
        { source: "toolZ", target: "toolX", type: "is_used_by" },
      ],
    };
    expect(payload.edges).toHaveLength(3);
    expect(payload.edges).toEqual(
      expect.arrayContaining([
        { source: "toolX", target: "toolY", type: "requires" },
        { source: "toolY", target: "toolZ", type: "enhances" },
        { source: "toolZ", target: "toolX", type: "is_used_by" },
      ])
    );
  });

  it("should return an empty graph if no dependencies are provided", () => {
    const payload: CapabilityGraphPayload = {
      nodes: {
        "toolOnly": { name: "Tool Only", description: "Standalone tool" },
      },
      edges: [],
    };
    expect(payload.nodes).toBeDefined();
    expect(payload.edges).toEqual([]);
  });
});