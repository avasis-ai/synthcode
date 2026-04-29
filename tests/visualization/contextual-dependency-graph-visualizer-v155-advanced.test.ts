import { describe, it, expect } from "vitest";
import {
  ContextualDependencyGraphVisualizerV155Advanced,
  NodeMetadata,
} from "../src/visualization/contextual-dependency-graph-visualizer-v155-advanced";

describe("ContextualDependencyGraphVisualizerV155Advanced", () => {
  it("should correctly initialize with basic nodes and edges", () => {
    const nodes: { id: string; label: string; metadata?: NodeMetadata }[] = [
      { id: "A", label: "Node A" },
      { id: "B", label: "Node B" },
    ];
    const edges = [
      { source: "A", target: "B", weight: 1 },
    ];
    const visualizer = new ContextualDependencyGraphVisualizerV155Advanced(nodes, edges);
    expect(visualizer).toBeDefined();
    expect(visualizer.getNodes()).toHaveLength(2);
    expect(visualizer.getEdges()).toHaveLength(1);
  });

  it("should incorporate temporal constraints in node metadata", () => {
    const nodes: { id: string; label: string; metadata?: NodeMetadata }[] = [
      {
        id: "C",
        label: "Node C",
        metadata: {
          temporal: { startTime: 100, endTime: 200 },
        },
      },
    ];
    const edges = [];
    const visualizer = new ContextualDependencyGraphVisualizerV155Advanced(nodes, edges);
    const nodeC = visualizer.getNode("C");
    expect(nodeC?.metadata?.temporal).toEqual({
      startTime: 100,
      endTime: 200,
    });
  });

  it("should handle multiple resource usages on a node", () => {
    const nodes: { id: string; label: string; metadata?: NodeMetadata }[] = [
      {
        id: "D",
        label: "Node D",
        metadata: {
          resources: [
            { resourceName: "CPU", usageAmount: 0.5 },
            { resourceName: "Memory", usageAmount: 1.2 },
          ],
        },
      },
    ];
    const edges = [];
    const visualizer = new ContextualDependencyGraphVisualizerV155Advanced(nodes, edges);
    const nodeD = visualizer.getNode("D");
    expect(nodeD?.metadata?.resources).toHaveLength(2);
    expect(nodeD?.metadata?.resources).toEqual(
      expect.arrayContaining([
        { resourceName: "CPU", usageAmount: 0.5 },
        { resourceName: "Memory", usageAmount: 1.2 },
      ])
    );
  });
});