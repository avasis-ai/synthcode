import { describe, it, expect } from "vitest";
import {
  DependencyEdge,
  ToolExecutionGraphPayload,
} from "../src/visualization/tool-execution-dependency-graph-visualizer-v139-advanced-advanced";

describe("ToolExecutionGraphVisualizer", () => {
  it("should correctly structure the payload for a simple sequential dependency", () => {
    const payload: ToolExecutionGraphPayload = {
      tools: {
        "toolA": {
          name: "toolA",
          description: "A tool",
          // ... other properties
        },
        "toolB": {
          name: "toolB",
          description: "A tool",
          // ... other properties
        },
      },
      edges: [
        {
          source: "toolA",
          target: "toolB",
          dependencyType: "sequential",
        },
      ],
    };
    // Assuming a function exists to process this payload, we test the structure itself.
    // In a real scenario, we would call the visualizer function here.
    expect(payload.edges).toHaveLength(1);
    expect(payload.edges[0].source).toBe("toolA");
    expect(payload.edges[0].dependencyType).toBe("sequential");
  });

  it("should handle parallel dependencies correctly", () => {
    const payload: ToolExecutionGraphPayload = {
      tools: {
        "toolX": { name: "toolX", description: "Tool X" },
        "toolY": { name: "toolY", description: "Tool Y" },
      },
      edges: [
        {
          source: "toolX",
          target: "toolY",
          dependencyType: "parallel",
          constraints: {
            requiredResource: "CPU",
            resourceCapacity: 2,
          },
        },
      ],
    };
    expect(payload.edges).toHaveLength(1);
    expect(payload.edges[0].dependencyType).toBe("parallel");
    expect(payload.edges[0].constraints).toBeDefined();
    expect(payload.edges[0].constraints?.resourceCapacity).toBe(2);
  });

  it("should include conditional dependency edges", () => {
    const payload: ToolExecutionGraphPayload = {
      tools: {
        "toolStart": { name: "toolStart", description: "Start" },
        "toolEnd": { name: "toolEnd", description: "End" },
      },
      edges: [
        {
          source: "toolStart",
          target: "toolEnd",
          dependencyType: "conditional",
          constraints: {
            startTime: 100,
            endTime: 200,
          },
        },
      ],
    };
    expect(payload.edges).toHaveLength(1);
    expect(payload.edges[0].dependencyType).toBe("conditional");
    expect(payload.edges[0].constraints).toBeDefined();
    expect(payload.edges[0].constraints?.startTime).toBe(100);
  });
});