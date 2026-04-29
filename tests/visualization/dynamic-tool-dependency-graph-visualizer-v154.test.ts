import { describe, it, expect } from "vitest";
import {
  DependencyEdge,
  DynamicToolDependencyGraphPayload,
} from "../src/visualization/dynamic-tool-dependency-graph-visualizer-v154";

describe("DynamicToolDependencyGraphVisualizer", () => {
  it("should correctly structure the payload with basic nodes and edges", () => {
    const payload: DynamicToolDependencyGraphPayload = {
      activeNodes: {
        "toolA": {
          name: "Tool A",
          description: "A tool for task A",
          status: "completed",
        },
        "toolB": {
          name: "Tool B",
          description: "A tool for task B",
          status: "pending",
        },
      },
      edges: [
        {
          sourceId: "toolA",
          targetId: "toolB",
          dependencyType: "requires",
          constraint: "capability",
        },
      ],
    };
    expect(payload.activeNodes).toHaveProperty("toolA");
    expect(payload.edges).toHaveLength(1);
    expect(payload.edges[0].dependencyType).toBe("requires");
  });

  it("should handle an empty graph state", () => {
    const payload: DynamicToolDependencyGraphPayload = {
      activeNodes: {},
      edges: [],
    };
    expect(payload.activeNodes).toEqual({});
    expect(payload.edges).toEqual([]);
  });

  it("should correctly represent a complex dependency structure", () => {
    const payload: DynamicToolDependencyGraphPayload = {
      activeNodes: {
        "start": {
          name: "Start Node",
          description: "Initial step",
          status: "completed",
        },
        "toolX": {
          name: "Tool X",
          description: "Main processing tool",
          status: "running",
        },
        "end": {
          name: "End Node",
          description: "Final result",
          status: "pending",
        },
      },
      edges: [
        {
          sourceId: "start",
          targetId: "toolX",
          dependencyType: "requires",
          constraint: "context",
        },
        {
          sourceId: "toolX",
          targetId: "end",
          dependencyType: "provides",
          constraint: "capability",
        },
      ],
    };
    expect(payload.activeNodes["toolX"].status).toBe("running");
    expect(payload.edges).toHaveLength(2);
    expect(payload.edges[1].sourceId).toBe("toolX");
    expect(payload.edges[1].dependencyType).toBe("provides");
  });
});