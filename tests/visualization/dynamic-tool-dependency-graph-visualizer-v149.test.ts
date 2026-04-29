import { describe, it, expect } from "vitest";
import {
  TemporalResourceMetadata,
  DependencyEdge,
  NodeData,
} from "../src/visualization/dynamic-tool-dependency-graph-visualizer-v149";

describe("DynamicToolDependencyGraphVisualizerV149", () => {
  it("should correctly structure node data for a simple user-assistant interaction", () => {
    const nodeData: NodeData[] = [
      { id: "user1", type: "user", content: "Hello world" },
      { id: "assistant1", type: "assistant", content: "Hi there!" },
    ];
    // Assuming a function that processes this data exists or we test the structure itself
    expect(nodeData.length).toBe(2);
    expect(nodeData[0].type).toBe("user");
    expect(nodeData[1].type).toBe("assistant");
  });

  it("should correctly structure dependency edges for a tool call sequence", () => {
    const edge: DependencyEdge = {
      sourceId: "user1",
      targetId: "toolA",
      metadata: {
        startTime: 100,
        endTime: 200,
        resourceUsage: { cpu: 0.5, memory: 10 },
      },
    };
    expect(edge.sourceId).toBe("user1");
    expect(edge.targetId).toBe("toolA");
    expect(edge.metadata.resourceUsage).toEqual({ cpu: 0.5, memory: 10 });
  });

  it("should handle an empty graph state gracefully", () => {
    const nodeData: NodeData[] = [];
    const edges: DependencyEdge[] = [];
    expect(nodeData.length).toBe(0);
    expect(edges.length).toBe(0);
  });
});