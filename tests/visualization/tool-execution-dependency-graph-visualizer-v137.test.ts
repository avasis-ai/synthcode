import { describe, it, expect } from "vitest";
import {
  DependencyGraphVisualizer,
  DependencyNode,
  ResourceMetadata,
  TemporalMetadata,
} from "../src/visualization/tool-execution-dependency-graph-visualizer-v137";

describe("DependencyGraphVisualizer", () => {
  it("should correctly initialize with basic nodes and edges", () => {
    const node1: DependencyNode = {
      id: "node1",
      type: "tool_call",
      metadata: { name: "toolA" },
    };
    const node2: DependencyNode = {
      id: "node2",
      type: "user_input",
      metadata: { name: "user_query" },
    };
    const edges = [{source: "node2", target: "node1"}];

    const visualizer = new DependencyGraphVisualizer(node1, node2, edges);

    expect(visualizer.getNodes()).toHaveLength(2);
    expect(visualizer.getEdges()).toHaveLength(1);
    expect(visualizer.getNode("node1")).toBeDefined();
  });

  it("should correctly calculate resource requirements from nodes", () => {
    const node1: DependencyNode = {
      id: "node1",
      type: "tool_call",
      metadata: { name: "toolA" },
    };
    const node2: DependencyNode = {
      id: "node2",
      type: "tool_call",
      metadata: { name: "toolB" },
    };
    const resources: ResourceMetadata[] = [
      { resourceName: "cpu", requiredAmount: 1, unit: "core" },
      { resourceName: "memory", requiredAmount: 2, unit: "GB" },
    ];

    const visualizer = new DependencyGraphVisualizer(node1, node2, [], resources);

    expect(visualizer.getTotalResourceUsage()).toEqual({
      cpu: 1,
      memory: 2,
    });
  });

  it("should correctly calculate total duration from temporal metadata", () => {
    const node1: DependencyNode = {
      id: "node1",
      type: "tool_call",
      metadata: { name: "toolA" },
    };
    const node2: DependencyNode = {
      id: "node2",
      type: "user_input",
      metadata: { name: "user_query" },
    };
    const temporalData: TemporalMetadata[] = [
      { startTimeMs: 0, endTimeMs: 1000, durationMs: 1000 },
      { startTimeMs: 1000, endTimeMs: 2500, durationMs: 1500 },
    ];

    const visualizer = new DependencyGraphVisualizer(node1, node2, [], temporalData);

    expect(visualizer.getTotalDurationMs()).toBe(2500);
  });
});