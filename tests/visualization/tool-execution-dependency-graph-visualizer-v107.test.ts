import { describe, it, expect } from "vitest";
import {
  ToolExecutionDependencyGraphVisualizer,
  ToolNode,
  ContextUpdateNode,
  DependencyEdge,
} from "../../../src/visualization/tool-execution-dependency-graph-visualizer-v107";

describe("ToolExecutionDependencyGraphVisualizer", () => {
  it("should correctly initialize with empty data", () => {
    const visualizer = new ToolExecutionDependencyGraphVisualizer();
    expect(visualizer.nodes).toEqual([]);
    expect(visualizer.edges).toEqual([]);
  });

  it("should add a single tool node and render it correctly", () => {
    const toolNode: ToolNode = {
      id: "tool1",
      name: "search",
      input: { query: "test" },
      output: { results: ["result1"] },
      latencyMs: 100,
      cost: 0.01,
    };
    const visualizer = new ToolExecutionDependencyGraphVisualizer();
    visualizer.addToolNode(toolNode);

    expect(visualizer.nodes).toHaveLength(1);
    expect(visualizer.nodes[0]).toEqual(toolNode);
    expect(visualizer.edges).toHaveLength(0);
  });

  it("should add nodes and edges representing a simple dependency chain", () => {
    const toolNode1: ToolNode = {
      id: "toolA",
      name: "toolA",
      input: {},
      output: { dataA: "dataA" },
      latencyMs: 50,
      cost: 0.01,
    };
    const toolNode2: ToolNode = {
      id: "toolB",
      name: "toolB",
      input: { dataA: "dataA" },
      output: { final: "final" },
      latencyMs: 100,
      cost: 0.02,
    };
    const contextNode: ContextUpdateNode = {
      id: "context1",
      description: "Initial context",
      dataKeys: ["initial_data"],
    };

    const visualizer = new ToolExecutionDependencyGraphVisualizer();
    visualizer.addToolNode(toolNode1);
    visualizer.addToolNode(toolNode2);
    visualizer.addContextNode(contextNode);
    visualizer.addEdge({
      sourceId: "context1",
      targetId: "toolA",
      type: "causality",
    });
    visualizer.addEdge({
      sourceId: "toolA",
      targetId: "toolB",
      type: "causality",
    });

    expect(visualizer.nodes).toHaveLength(3);
    expect(visualizer.edges).toHaveLength(2);
    expect(visualizer.edges).toEqual(expect.arrayContaining([
      { sourceId: "context1", targetId: "toolA", type: "causality" },
      { sourceId: "toolA", targetId: "toolB", type: "causality" },
    ]));
  });
});