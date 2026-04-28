import { describe, it, expect } from "vitest";
import { ToolDependencyGraphVisualizer } from "../src/visualization/tool-dependency-graph-visualizer-v139";

describe("ToolDependencyGraphVisualizer", () => {
  it("should correctly initialize with basic tool data", () => {
    const visualizer = new ToolDependencyGraphVisualizer();
    expect(visualizer).toBeDefined();
  });

  it("should add a tool node correctly", () => {
    const visualizer = new ToolDependencyGraphVisualizer();
    const toolNode = {
      id: "toolA",
      name: "Tool A",
      description: "A useful tool",
      inputs: [{ name: "input1", type: "string", required: true }],
      outputs: [{ name: "output1", type: "string" }],
    };
    visualizer.addToolNode(toolNode);
    expect(visualizer.getToolNodes().some(node => node.id === "toolA")).toBe(true);
  });

  it("should add a dependency edge between two tools", () => {
    const visualizer = new ToolDependencyGraphVisualizer();
    const toolA = {
      id: "toolA",
      name: "Tool A",
      description: "Tool A",
      inputs: [],
      outputs: [{ name: "outputA", type: "string" }],
    };
    const toolB = {
      id: "toolB",
      name: "Tool B",
      description: "Tool B",
      inputs: [{ name: "inputB", type: "string", required: true }],
      outputs: [],
    };
    visualizer.addToolNode(toolA);
    visualizer.addToolNode(toolB);
    visualizer.addDependencyEdge("toolA", "toolB", "OUTPUT_CONSUMED");
    expect(visualizer.getDependencyEdges().some(edge => edge.source === "toolA" && edge.target === "toolB" && edge.type === "OUTPUT_CONSUMED")).toBe(true);
  });
});