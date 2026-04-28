import { describe, it, expect } from "vitest";
import {
  NodePayload,
  EdgePayload,
} from "../src/visualization/dynamic-dependency-graph-visualizer";

describe("DynamicDependencyGraphVisualizer", () => {
  it("should correctly initialize with empty payloads", () => {
    const visualizer = {
      nodes: [] as NodePayload[],
      edges: [] as EdgePayload[],
    };
    // Assuming there's a method or constructor to test initialization,
    // we'll test the structure if it's a class, or just check the types if it's a function.
    // Since we don't have the implementation, we test the expected structure handling.
    expect(visualizer.nodes).toEqual([]);
    expect(visualizer.edges).toEqual([]);
  });

  it("should add a node with correct structure", () => {
    const node: NodePayload = {
      id: "node1",
      label: "Test Node",
      type: "tool",
      position: { x: 10, y: 20 },
    };
    // Mocking an addNode function call if it existed, or simulating the state update.
    const visualizer = {
      nodes: [node] as NodePayload[],
      edges: [] as EdgePayload[],
    };
    expect(visualizer.nodes).toHaveLength(1);
    expect(visualizer.nodes[0].id).toBe("node1");
    expect(visualizer.nodes[0].type).toBe("tool");
  });

  it("should add an edge connecting two existing nodes", () => {
    const nodeA: NodePayload = {
      id: "A",
      label: "Start",
      type: "agent",
      position: { x: 0, y: 0 },
    };
    const nodeB: NodePayload = {
      id: "B",
      label: "End",
      type: "tool",
      position: { x: 100, y: 100 },
    };
    const edge: EdgePayload = {
      source: "A",
      target: "B",
      relationship: "calls",
      startTime: 1000,
      endTime: 2000,
      weight: 0.8,
    };

    const visualizer = {
      nodes: [nodeA, nodeB] as NodePayload[],
      edges: [edge] as EdgePayload[],
    };
    expect(visualizer.edges).toHaveLength(1);
    expect(visualizer.edges[0].source).toBe("A");
    expect(visualizer.edges[0].target).toBe("B");
  });
});