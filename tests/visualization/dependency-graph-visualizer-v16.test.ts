import { describe, it, expect } from "vitest";
import {
  DependencyGraphVisualizerV16,
  TemporalEdge,
} from "../src/visualization/dependency-graph-visualizer-v16";

describe("DependencyGraphVisualizerV16", () => {
  it("should correctly initialize with empty data", () => {
    const visualizer = new DependencyGraphVisualizerV16();
    expect(visualizer.nodes).toEqual([]);
    expect(visualizer.edges).toEqual([]);
  });

  it("should add nodes and edges correctly", () => {
    const visualizer = new DependencyGraphVisualizerV16();
    const nodes = [
      { id: "A", label: "Node A" },
      { id: "B", label: "Node B" },
    ];
    const edges: TemporalEdge[] = [
      {
        sourceNodeId: "A",
        targetNodeId: "B",
        startTimeWindow: { start: 0, end: 10 },
        duration: 5,
        resourceUsage: {
          cpu: { usage: 1, requiredCapacity: 1 },
        },
      },
    ];

    visualizer.addNodes(nodes);
    visualizer.addEdges(edges);

    expect(visualizer.nodes).toEqual(nodes);
    expect(visualizer.edges).toEqual(edges);
  });

  it("should handle updates to existing nodes and edges", () => {
    const visualizer = new DependencyGraphVisualizerV16();
    const initialNodes = [{ id: "A", label: "Node A" }];
    const initialEdges: TemporalEdge[] = [
      {
        sourceNodeId: "A",
        targetNodeId: "B",
        startTimeWindow: { start: 0, end: 10 },
        duration: 5,
        resourceUsage: { cpu: { usage: 1, requiredCapacity: 1 } },
      },
    ];

    visualizer.addNodes(initialNodes);
    visualizer.addEdges(initialEdges);

    const updatedNodes = [{ id: "A", label: "Updated Node A" }];
    const updatedEdges: TemporalEdge[] = [
      {
        sourceNodeId: "A",
        targetNodeId: "B",
        startTimeWindow: { start: 0, end: 10 },
        duration: 5,
        resourceUsage: { cpu: { usage: 2, requiredCapacity: 2 } },
      },
    ];

    visualizer.updateNodes(updatedNodes);
    visualizer.updateEdges(updatedEdges);

    expect(visualizer.nodes).toEqual(updatedNodes);
    expect(visualizer.edges).toEqual(updatedEdges);
  });
});