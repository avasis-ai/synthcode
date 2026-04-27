import { describe, it, expect } from "vitest";
import { DependencyGraphVisualizerV32 } from "../src/visualization/dependency-graph-visualizer-v32";

describe("DependencyGraphVisualizerV32", () => {
  it("should correctly initialize with an empty graph", () => {
    const visualizer = new DependencyGraphVisualizerV32();
    expect(visualizer.getNodes()).toEqual([]);
    expect(visualizer.getEdges()).toEqual([]);
  });

  it("should add nodes and edges correctly when provided with data", () => {
    const nodes = [{ id: "A", label: "Node A" }, { id: "B", label: "Node B" }];
    const edges = [{ source: "A", target: "B", weight: 0.8 }];
    const visualizer = new DependencyGraphVisualizerV32(nodes, edges);

    expect(visualizer.getNodes()).toHaveLength(2);
    expect(visualizer.getEdges()).toHaveLength(1);
    expect(visualizer.getNodes()).toContainEqual({ id: "A", label: "Node A" });
    expect(visualizer.getEdges()).toContainEqual({ source: "A", target: "B", weight: 0.8 });
  });

  it("should handle updates to existing nodes and edges", () => {
    const initialNodes = [{ id: "A", label: "Old A" }];
    const initialEdges = [{ source: "A", target: "B", weight: 0.5 }];
    const visualizer = new DependencyGraphVisualizerV32(initialNodes, initialEdges);

    const updatedNodes = [{ id: "A", label: "New A" }, { id: "C", label: "New Node C" }];
    const updatedEdges = [{ source: "A", target: "C", weight: 0.9 }];
    visualizer.updateGraph(updatedNodes, updatedEdges);

    expect(visualizer.getNodes()).toHaveLength(2);
    expect(visualizer.getNodes()).toContainEqual({ id: "A", label: "New A" });
    expect(visualizer.getNodes()).toContainEqual({ id: "C", label: "New Node C" });

    expect(visualizer.getEdges()).toHaveLength(1);
    expect(visualizer.getEdges()).toContainEqual({ source: "A", target: "C", weight: 0.9 });
  });
});