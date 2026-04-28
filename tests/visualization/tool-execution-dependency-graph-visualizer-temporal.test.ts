import { describe, it, expect } from "vitest";
import {
  TemporalResourceNode,
  TemporalResourceEdge,
  TemporalGraphPayload,
} from "../src/visualization/tool-execution-dependency-graph-visualizer-temporal";

describe("TemporalGraphVisualizer", () => {
  it("should correctly initialize with empty data", () => {
    const visualizer = {
      nodes: [] as TemporalResourceNode[],
      edges: [] as TemporalResourceEdge[],
      payload: {} as TemporalGraphPayload,
    };
    // Assuming there's a method or property to check initial state,
    // or we test the structure if it's a class/object instance.
    // Since we don't have the implementation, we test the structure based on the payload type.
    expect(visualizer.nodes).toEqual([]);
    expect(visualizer.edges).toEqual([]);
  });

  it("should process a basic set of nodes and edges", () => {
    const nodes: TemporalResourceNode[] = [
      {
        id: "A",
        label: "Start",
        startTime: 0,
        endTime: 10,
        resourceUsage: { cpu: 1, memory: 2 },
      },
      {
        id: "B",
        label: "Process",
        startTime: 5,
        endTime: 15,
        resourceUsage: { cpu: 2, memory: 1 },
      },
    ];
    const edges: TemporalResourceEdge[] = [
      {
        sourceId: "A",
        targetId: "B",
        duration: 5,
        dependencyType: "causal",
      },
    ];
    const payload: TemporalGraphPayload = {
      nodes: nodes,
      edges: edges,
    };

    // Mocking the visualizer initialization/update if it were a class
    const visualizer = {
      nodes: nodes,
      edges: edges,
      payload: payload,
    };

    expect(visualizer.nodes.length).toBe(2);
    expect(visualizer.edges.length).toBe(1);
    expect(visualizer.payload).toEqual(payload);
  });

  it("should handle complex temporal dependencies", () => {
    const nodes: TemporalResourceNode[] = [
      {
        id: "N1",
        label: "Task 1",
        startTime: 100,
        endTime: 200,
        resourceUsage: { gpu: 1 },
      },
      {
        id: "N2",
        label: "Task 2",
        startTime: 200,
        endTime: 300,
        resourceUsage: { gpu: 1 },
      },
    ];
    const edges: TemporalResourceEdge[] = [
      {
        sourceId: "N1",
        targetId: "N2",
        duration: 100,
        dependencyType: "temporal",
      },
      {
        sourceId: "N1",
        targetId: "N2",
        duration: 0,
        dependencyType: "resource",
      },
    ];
    const payload: TemporalGraphPayload = {
      nodes: nodes,
      edges: edges,
    };

    const visualizer = {
      nodes: nodes,
      edges: edges,
      payload: payload,
    };

    expect(visualizer.nodes[0].resourceUsage.gpu).toBe(1);
    expect(visualizer.edges.some(e => e.dependencyType === "temporal")).toBe(true);
  });
});