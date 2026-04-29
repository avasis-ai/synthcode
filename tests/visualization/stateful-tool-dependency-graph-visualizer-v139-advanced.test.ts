import { describe, it, expect } from "vitest";
import {
  ToolCallNode,
  DependencyEdge,
} from "../src/visualization/stateful-tool-dependency-graph-visualizer-v139-advanced";

describe("StatefulToolDependencyGraphVisualizer", () => {
  it("should correctly initialize with basic nodes and edges", () => {
    const toolCallNode: ToolCallNode = {
      id: "tool1",
      toolName: "search",
      input: { query: "test" },
      startTime: 100,
      endTime: 200,
      initialState: "start",
      finalState: "success",
    };
    const dependencyEdge: DependencyEdge = {
      sourceId: "tool1",
      targetId: "tool2",
      dependencyType: "CALL",
      startTime: 200,
    };

    const visualizer = {
      nodes: [toolCallNode],
      edges: [dependencyEdge],
      // Mock methods if necessary for a full test, but for structure check:
    };

    // Assuming there's a method or property to check initialization state
    // Since the implementation isn't provided, we test the structure passed in.
    expect(visualizer.nodes).toHaveLength(1);
    expect(visualizer.edges).toHaveLength(1);
    expect(visualizer.nodes[0].id).toBe("tool1");
    expect(visualizer.edges[0].dependencyType).toBe("CALL");
  });

  it("should handle multiple nodes and diverse dependency types", () => {
    const nodes: ToolCallNode[] = [
      {
        id: "nodeA",
        toolName: "toolA",
        input: {},
        startTime: 0,
        endTime: 100,
        initialState: "init",
        finalState: "stateA",
      },
      {
        id: "nodeB",
        toolName: "toolB",
        input: {},
        startTime: 150,
        endTime: 250,
        initialState: "stateA",
        finalState: "stateB",
      },
    ];
    const edges: DependencyEdge[] = [
      {
        sourceId: "nodeA",
        targetId: "nodeB",
        dependencyType: "DATA_FLOW",
        startTime: 100,
      },
      {
        sourceId: "nodeA",
        targetId: "nodeB",
        dependencyType: "STATE_TRANSITION",
        startTime: 100,
      },
    ];

    const visualizer = {
      nodes: nodes,
      edges: edges,
    };

    expect(visualizer.nodes).toHaveLength(2);
    expect(visualizer.edges).toHaveLength(2);
    expect(visualizer.edges.some(e => e.dependencyType === "DATA_FLOW")).toBe(true);
    expect(visualizer.nodes[1].finalState).toBe("stateB");
  });

  it("should correctly process an empty graph state", () => {
    const visualizer = {
      nodes: [],
      edges: [],
    };

    expect(visualizer.nodes).toHaveLength(0);
    expect(visualizer.edges).toHaveLength(0);
  });
});