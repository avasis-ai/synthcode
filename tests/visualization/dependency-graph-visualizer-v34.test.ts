import { describe, it, expect } from "vitest";
import {
  DependencyGraphVisualizer,
  DependencyNode,
  ResourceConstraint,
} from "../src/visualization/dependency-graph-visualizer-v34";

describe("DependencyGraphVisualizer", () => {
  it("should correctly initialize with an empty graph", () => {
    const visualizer = new DependencyGraphVisualizer();
    expect(visualizer.nodes).toEqual([]);
    expect(visualizer.edges).toEqual([]);
  });

  it("should add nodes and edges correctly from a sample set", () => {
    const node1: DependencyNode = {
      id: "n1",
      type: "message",
      content: "Hello",
      startTime: 100,
      endTime: 200,
      metadata: {},
    };
    const node2: DependencyNode = {
      id: "n2",
      type: "tool_call",
      content: "tool_a",
      startTime: 200,
      endTime: 300,
      metadata: {},
    };
    const edge = {source: "n1", target: "n2", weight: 1};

    const visualizer = new DependencyGraphVisualizer();
    visualizer.addNode(node1);
    visualizer.addNode(node2);
    visualizer.addEdge(edge);

    expect(visualizer.nodes).toHaveLength(2);
    expect(visualizer.edges).toHaveLength(1);
    expect(visualizer.nodes).toContainEqual(node1);
    expect(visualizer.edges).toContainEqual(edge);
  });

  it("should calculate total duration correctly when multiple nodes are added", () => {
    const visualizer = new DependencyGraphVisualizer();
    const node1: DependencyNode = {
      id: "n1",
      type: "message",
      content: "Start",
      startTime: 0,
      endTime: 100,
      metadata: {},
    };
    const node2: DependencyNode = {
      id: "n2",
      type: "thinking",
      content: "Thinking",
      startTime: 100,
      endTime: 250,
      metadata: {},
    };
    const node3: DependencyNode = {
      id: "n3",
      type: "message",
      content: "End",
      startTime: 250,
      endTime: 300,
      metadata: {},
    };

    visualizer.addNode(node1);
    visualizer.addNode(node2);
    visualizer.addNode(node3);

    // Total duration should be the end time of the last node
    expect(visualizer.getTotalDuration()).toBe(300);
  });
});