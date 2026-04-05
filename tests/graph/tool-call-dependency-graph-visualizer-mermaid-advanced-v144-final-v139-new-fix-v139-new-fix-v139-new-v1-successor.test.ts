import { describe, it, expect } from "vitest";
import { ToolCallDependencyGraphVisualizer } from "../src/graph/tool-call-dependency-graph-visualizer-mermaid-advanced-v144-final-v139-new-fix-v139-new-fix-v139-new-v1-successor";

describe("ToolCallDependencyGraphVisualizer", () => {
  it("should initialize correctly with empty nodes and edges", () => {
    const visualizer = new ToolCallDependencyGraphVisualizer();
    expect(visualizer.nodes).toEqual([]);
    expect(visualizer.edges).toEqual([]);
  });

  it("should add nodes and edges correctly", () => {
    const visualizer = new ToolCallDependencyGraphVisualizer();
    const node1 = { id: "start", label: "Start", type: "start" };
    const node2 = { id: "tool_call_1", label: "Tool Call 1", type: "tool_call" };
    const edge1 = { from: "start", to: "tool_call_1", label: "Always" };

    visualizer.addNode(node1);
    visualizer.addNode(node2);
    visualizer.addEdge(edge1);

    expect(visualizer.nodes).toHaveLength(2);
    expect(visualizer.edges).toHaveLength(1);
    expect(visualizer.nodes).toContainEqual(node1);
    expect(visualizer.edges).toContainEqual(edge1);
  });

  it("should generate a basic mermaid graph string", () => {
    const visualizer = new ToolCallDependencyGraphVisualizer();
    const node1 = { id: "start", label: "Start", type: "start" };
    const node2 = { id: "tool_call_1", label: "Tool Call 1", type: "tool_call" };
    const edge1 = { from: "start", to: "tool_call_1", label: "Always" };

    visualizer.addNode(node1);
    visualizer.addNode(node2);
    visualizer.addEdge(edge1);

    const mermaidGraph = visualizer.generateMermaidGraph();
    expect(mermaidGraph).toContain("graph TD");
    expect(mermaidGraph).toContain("start[Start]");
    expect(mermaidGraph).toContain("tool_call_1[Tool Call 1]");
    expect(mermaidGraph).toContain("start --> tool_call_1");
  });
});