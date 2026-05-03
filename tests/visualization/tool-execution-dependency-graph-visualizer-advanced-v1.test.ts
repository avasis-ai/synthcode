import { describe, it, expect } from "vitest";
import { ToolExecutionDependencyGraphVisualizerAdvancedV1 } from "../src/visualization/tool-execution-dependency-graph-visualizer-advanced-v1";

describe("ToolExecutionDependencyGraphVisualizerAdvancedV1", () => {
  it("should correctly initialize with empty data", () => {
    const visualizer = new ToolExecutionDependencyGraphVisualizerAdvancedV1([]);
    expect(visualizer.getNodes()).toEqual([]);
    expect(visualizer.getEdges()).toEqual([]);
  });

  it("should process a simple linear dependency graph", () => {
    const mockTrace = [
      { toolId: "toolA", startTime: 10, endTime: 20, output: { data: "A_output" } },
      { toolId: "toolB", startTime: 20, endTime: 30, output: { data: "B_output" } },
    ];
    const visualizer = new ToolExecutionDependencyGraphVisualizerAdvancedV1(mockTrace);

    const nodes = visualizer.getNodes();
    expect(nodes.length).toBe(2);
    expect(nodes.some(n => n.toolId === "toolA" && n.startTime === 10)).toBe(true);

    const edges = visualizer.getEdges();
    expect(edges.length).toBe(1);
    expect(edges[0].sourceToolId).toBe("toolA");
    expect(edges[0].targetToolId).toBe("toolB");
    expect(edges[0].dependencyType).toBe("temporal");
  });

  it("should detect and model a data flow dependency", () => {
    const mockTrace = [
      { toolId: "toolA", startTime: 10, endTime: 20, output: { data: "A_output" } },
      { toolId: "toolB", startTime: 25, endTime: 35, output: { data: "B_output" } },
    ];
    // Assume toolB depends on a specific field from toolA's output
    const visualizer = new ToolExecutionDependencyGraphVisualizerAdvancedV1(mockTrace, {
      dependencies: [
        { sourceToolId: "toolA", targetToolId: "toolB", dependencyType: "data_flow", dataFlow: { sourceField: "data", targetField: "input_data" } }
      ]
    });

    const edges = visualizer.getEdges();
    expect(edges.length).toBe(1);
    expect(edges[0].dependencyType).toBe("data_flow");
    expect(edges[0].dataFlow?.sourceField).toBe("data");
  });
});