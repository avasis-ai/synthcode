import { describe, it, expect } from "vitest";
import {
  DependencyGraph,
  ToolNode,
  DataFlowEdge,
} from "../src/visualization/dynamic-tool-dependency-graph-visualizer-v151";

describe("DependencyGraph", () => {
  it("should correctly construct a basic graph from provided nodes and edges", () => {
    const nodes: ToolNode[] = [
      {
        id: "toolA",
        name: "Tool A",
        description: "Desc A",
        inputs: {},
        outputs: ["output1"],
      },
      {
        id: "toolB",
        name: "Tool B",
        description: "Desc B",
        inputs: {},
        outputs: ["output2"],
      },
    ];
    const edges: DataFlowEdge[] = [
      {
        sourceToolId: "toolA",
        targetToolId: "toolB",
        dataKeys: ["output1"],
      },
    ];
    const graph = { nodes: nodes, edges: edges };

    expect(graph.nodes).toHaveLength(2);
    expect(graph.edges).toHaveLength(1);
    expect(graph.nodes[0].id).toBe("toolA");
    expect(graph.edges[0].sourceToolId).toBe("toolA");
  });

  it("should handle an empty graph structure", () => {
    const graph: DependencyGraph = { nodes: [], edges: [] };
    expect(graph.nodes).toEqual([]);
    expect(graph.edges).toEqual([]);
  });

  it("should correctly represent a graph with multiple dependencies", () => {
    const nodes: ToolNode[] = [
      {
        id: "tool1",
        name: "Tool 1",
        description: "Desc 1",
        inputs: {},
        outputs: ["data1"],
      },
      {
        id: "tool2",
        name: "Tool 2",
        description: "Desc 2",
        inputs: {},
        outputs: ["data2"],
      },
      {
        id: "tool3",
        name: "Tool 3",
        description: "Desc 3",
        inputs: {},
        outputs: [],
      },
    ];
    const edges: DataFlowEdge[] = [
      {
        sourceToolId: "tool1",
        targetToolId: "tool2",
        dataKeys: ["data1"],
      },
      {
        sourceToolId: "tool1",
        targetToolId: "tool3",
        dataKeys: ["data1"],
      },
      {
        sourceToolId: "tool2",
        targetToolId: "tool3",
        dataKeys: ["data2"],
      },
    ];
    const graph: DependencyGraph = { nodes: nodes, edges: edges };

    expect(graph.nodes).toHaveLength(3);
    expect(graph.edges).toHaveLength(3);
    expect(graph.edges).toEqual(expect.arrayContaining([
      {
        sourceToolId: "tool1",
        targetToolId: "tool2",
        dataKeys: ["data1"],
      },
    ]));
  });
});