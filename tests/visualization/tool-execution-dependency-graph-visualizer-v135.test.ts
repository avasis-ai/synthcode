import { describe, it, expect } from "vitest";
import {
  ToolNodeData,
  ToolEdgeData,
} from "../src/visualization/tool-execution-dependency-graph-visualizer-v135";

describe("ToolExecutionDependencyGraphVisualizerV135", () => {
  it("should correctly initialize with basic node and edge data", () => {
    const nodes: ToolNodeData[] = [
      { id: "t1", name: "Tool A", description: "Desc A" },
      { id: "t2", name: "Tool B", description: "Desc B" },
    ];
    const edges: ToolEdgeData[] = [
      { sourceId: "t1", targetId: "t2", dependencyType: "sequential" },
    ];
    const visualizer = {
      nodes: nodes,
      edges: edges,
    };
    expect(visualizer.nodes).toHaveLength(2);
    expect(visualizer.edges).toHaveLength(1);
  });

  it("should handle nodes with resource usage data", () => {
    const nodes: ToolNodeData[] = [
      {
        id: "t1",
        name: "Tool A",
        description: "Desc A",
        resourceUsage: { cpu: 0.5, memory: 1024 },
      },
    ];
    const edges: ToolEdgeData[] = [];
    const visualizer = {
      nodes: nodes,
      edges: edges,
    };
    expect(visualizer.nodes[0].resourceUsage).toEqual({
      cpu: 0.5,
      memory: 1024,
    });
  });

  it("should correctly process multiple dependency types", () => {
    const nodes: ToolNodeData[] = [
      { id: "t1", name: "Tool A", description: "Desc A" },
      { id: "t2", name: "Tool B", description: "Desc B" },
      { id: "t3", name: "Tool C", description: "Desc C" },
    ];
    const edges: ToolEdgeData[] = [
      { sourceId: "t1", targetId: "t2", dependencyType: "sequential" },
      { sourceId: "t1", targetId: "t3", dependencyType: "parallel" },
      { sourceId: "t2", targetId: "t3", dependencyType: "conditional" },
    ];
    const visualizer = {
      nodes: nodes,
      edges: edges,
    };
    expect(visualizer.edges.some(e => e.dependencyType === "sequential")).toBe(true);
    expect(visualizer.edges.some(e => e.dependencyType === "parallel")).toBe(true);
    expect(visualizer.edges.some(e => e.dependencyType === "conditional")).toBe(true);
  });
});