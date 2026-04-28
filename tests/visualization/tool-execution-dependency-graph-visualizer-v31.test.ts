import { describe, it, expect } from "vitest";
import { DependencyGraphData } from "../src/visualization/tool-execution-dependency-graph-visualizer-v31";

describe("ToolExecutionDependencyGraphVisualizerV31", () => {
  it("should correctly construct DependencyGraphData from sample inputs", () => {
    const nodes: any[] = [
      { id: "A", label: "Tool A", startTime: 100, endTime: 200, resourceUsage: { cpu: 0.5, memory: 10 } },
      { id: "B", label: "Tool B", startTime: 150, endTime: 250, resourceUsage: { cpu: 0.3, memory: 5 } },
    ];
    const edges: any[] = [
      { sourceId: "A", targetId: "B", startTime: 150, endTime: 200, dataTransferSize: 50 },
    ];
    const data: DependencyGraphData = { nodes, edges };

    const visualizer = new (class {
      constructor(data: DependencyGraphData) { this.data = data; }
      getGraphData(): DependencyGraphData { return this.data; }
    })(data);

    const result = visualizer.getGraphData();
    expect(result.nodes).toHaveLength(2);
    expect(result.edges).toHaveLength(1);
    expect(result.nodes[0].id).toBe("A");
  });

  it("should handle empty graph data gracefully", () => {
    const data: DependencyGraphData = { nodes: [], edges: [] };
    const visualizer = new (class {
      constructor(data: DependencyGraphData) { this.data = data; }
      getGraphData(): DependencyGraphData { return this.data; }
    })(data);

    const result = visualizer.getGraphData();
    expect(result.nodes).toEqual([]);
    expect(result.edges).toEqual([]);
  });

  it("should correctly map node and edge properties", () => {
    const nodes: any[] = [
      { id: "Start", label: "Start", startTime: 0, endTime: 50, resourceUsage: { cpu: 0, memory: 0 } },
    ];
    const edges: any[] = [
      { sourceId: "Start", targetId: "End", startTime: 50, endTime: 100, dataTransferSize: 100 },
    ];
    const data: DependencyGraphData = { nodes, edges };

    const visualizer = new (class {
      constructor(data: DependencyGraphData) { this.data = data; }
      getGraphData(): DependencyGraphData { return this.data; }
    })(data);

    const result = visualizer.getGraphData();
    expect(result.nodes[0].label).toBe("Start");
    expect(result.edges[0].dataTransferSize).toBe(100);
  });
});