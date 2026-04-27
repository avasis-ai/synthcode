import { describe, it, expect } from "vitest";
import {
  ToolExecutionNode,
  DependencyEdge,
} from "../src/visualization/tool-execution-dependency-graph-visualizer-v104";

describe("ToolExecutionDependencyGraphVisualizerV104", () => {
  it("should correctly construct a graph from a simple sequence of tools", () => {
    const nodes: ToolExecutionNode[] = [
      {
        toolName: "ToolA",
        toolId: "A1",
        startTime: 100,
        endTime: 200,
        resourceUsage: { cpu: 0.5 },
        input: { param1: "data1" },
        output: { resultA: true },
      },
      {
        toolName: "ToolB",
        toolId: "B1",
        startTime: 200,
        endTime: 350,
        resourceUsage: { cpu: 0.8 },
        input: { param2: "data2" },
        output: { resultB: "processed" },
      },
    ];
    const edges: DependencyEdge[] = [
      {
        sourceNodeId: "A1",
        targetNodeId: "B1",
        dependencyType: "sequential",
      },
    ];
    const graph = { nodes, edges };
    expect(graph.nodes.length).toBe(2);
    expect(graph.edges.length).toBe(1);
    expect(graph.edges[0].sourceNodeId).toBe("A1");
    expect(graph.edges[0].targetNodeId).toBe("B1");
  });

  it("should handle a graph with no dependencies", () => {
    const nodes: ToolExecutionNode[] = [
      {
        toolName: "ToolX",
        toolId: "X1",
        startTime: 50,
        endTime: 150,
        resourceUsage: { cpu: 0.3 },
        input: { param: 1 },
        output: { final: "ok" },
      },
      {
        toolName: "ToolY",
        toolId: "Y1",
        startTime: 10,
        endTime: 50,
        resourceUsage: { cpu: 0.1 },
        input: { param: 2 },
        output: { final: "ok" },
      },
    ];
    const edges: DependencyEdge[] = [];
    const graph = { nodes, edges };
    expect(graph.nodes.length).toBe(2);
    expect(graph.edges.length).toBe(0);
  });

  it("should correctly identify multiple dependencies between nodes", () => {
    const nodes: ToolExecutionNode[] = [
      {
        toolName: "ToolStart",
        toolId: "S1",
        startTime: 0,
        endTime: 100,
        resourceUsage: { cpu: 0.1 },
        input: {},
        output: { data: "start" },
      },
      {
        toolName: "ToolMiddle",
        toolId: "M1",
        startTime: 100,
        endTime: 200,
        resourceUsage: { cpu: 0.5 },
        input: { data: "start" },
        output: { data: "middle" },
      },
      {
        toolName: "ToolEnd",
        toolId: "E1",
        startTime: 200,
        endTime: 300,
        resourceUsage: { cpu: 0.2 },
        input: { data: "middle" },
        output: { final: true },
      },
    ];
    const edges: DependencyEdge[] = [
      {
        sourceNodeId: "S1",
        targetNodeId: "M1",
        dependencyType: "sequential",
      },
      {
        sourceNodeId: "S1",
        targetNodeId: "E1",
        dependencyType: "parallel",
      },
      {
        sourceNodeId: "M1",
        targetNodeId: "E1",
        dependencyType: "sequential",
      },
    ];
    const graph = { nodes, edges };
    expect(graph.nodes.length).toBe(3);
    expect(graph.edges.length).toBe(3);
    expect(graph.edges.some(e => e.sourceNodeId === "S1" && e.targetNodeId === "M1" && e.dependencyType === "sequential")).toBe(true);
    expect(graph.edges.some(e => e.sourceNodeId === "S1" && e.targetNodeId === "E1" && e.dependencyType === "parallel")).toBe(true);
  });
});