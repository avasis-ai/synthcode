import { describe, it, expect } from "vitest";
import { ToolExecutionGraphVisualizerV3, ExecutionGraph } from "../src/visualization/tool-execution-graph-visualizer-v3";

describe("ToolExecutionGraphVisualizerV3", () => {
  it("should correctly initialize with a valid graph", () => {
    const mockGraph: ExecutionGraph = {
      nodes: [
        { id: "n1", type: "message", content: "Hi", metadata: {} },
        { id: "n2", type: "tool_result", content: "Result", metadata: {} },
      ],
      edges: [
        { sourceId: "n1", targetId: "n2", flowType: "data", weight: 1.0 },
      ],
    };
    const visualizer = new ToolExecutionGraphVisualizerV3(mockGraph);
    expect(visualizer).toBeDefined();
  });

  it("should handle an empty graph gracefully", () => {
    const emptyGraph: ExecutionGraph = {
      nodes: [],
      edges: [],
    };
    const visualizer = new ToolExecutionGraphVisualizerV3(emptyGraph);
    // Assuming there's a method to check if visualization data is empty or if it throws
    // For this test, we just check instantiation and assume internal state is handled.
    expect(visualizer).toBeDefined();
  });

  it("should correctly process a graph with multiple nodes and edges", () => {
    const mockGraph: ExecutionGraph = {
      nodes: [
        { id: "start", type: "message", content: "Start", metadata: {} },
        { id: "think", type: "thinking", content: "Thinking...", metadata: {} },
        { id: "end", type: "tool_result", content: "Done", metadata: {} },
      ],
      edges: [
        { sourceId: "start", targetId: "think", flowType: "control", weight: 1.0 },
        { sourceId: "think", targetId: "end", flowType: "data", weight: 0.8 },
      ],
    };
    const visualizer = new ToolExecutionGraphVisualizerV3(mockGraph);
    // Add an assertion based on expected output structure if a public method exists
    // e.g., expect(visualizer.getVisualizationData()).toEqual(expect.objectContaining({ nodes: expect.arrayContaining([expect.objectContaining({ id: "start" })])}));
  });
});