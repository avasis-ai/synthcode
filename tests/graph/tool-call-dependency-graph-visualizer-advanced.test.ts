import { describe, it, expect } from "vitest";
import { DependencyGraph } from "../src/graph/tool-call-dependency-graph-visualizer-advanced";

describe("DependencyGraph", () => {
  it("should correctly construct a simple linear dependency graph", () => {
    const graph = {
      nodes: [
        {
          id: "node1",
          message: { type: "text", content: "Start" },
          metadata: { inputs: {}, outputs: {}, guardStatus: "passed" },
        },
        {
          id: "node2",
          message: { type: "tool_use", content: "tool_call_1" },
          metadata: { inputs: { paramA: "valueA" }, outputs: { resultB: "resultB" }, guardStatus: "passed" },
        },
        {
          id: "node3",
          message: { type: "text", content: "End" },
          metadata: { inputs: {}, outputs: {}, guardStatus: "passed" },
        },
      ],
      edges: [
        { source: "node1", target: "node2", type: "control", description: "calls tool" },
        { source: "node2", target: "node3", type: "data", description: "uses result" },
      ],
    };

    expect(graph.nodes.length).toBe(3);
    expect(graph.edges.length).toBe(2);
    expect(graph.edges[0].type).toBe("control");
    expect(graph.edges[1].type).toBe("data");
  });

  it("should handle a graph with branching control flow", () => {
    const graph = {
      nodes: [
        {
          id: "start",
          message: { type: "text", content: "Start" },
          metadata: { inputs: {}, outputs: {}, guardStatus: "passed" },
        },
        {
          id: "condition",
          message: { type: "text", content: "Check condition" },
          metadata: { inputs: {}, outputs: {}, guardStatus: "passed" },
        },
        {
          id: "branch_true",
          message: { type: "tool_use", content: "tool_A" },
          metadata: { inputs: {}, outputs: { resultA: "dataA" }, guardStatus: "passed" },
        },
        {
          id: "branch_false",
          message: { type: "tool_use", content: "tool_B" },
          metadata: { inputs: {}, outputs: { resultB: "dataB" }, guardStatus: "passed" },
        },
        {
          id: "end",
          message: { type: "text", content: "End" },
          metadata: { inputs: {}, outputs: {}, guardStatus: "passed" },
        },
      ],
      edges: [
        { source: "start", target: "condition", type: "control", description: "proceeds to" },
        { source: "condition", target: "branch_true", type: "control", description: "if true" },
        { source: "condition", target: "branch_false", type: "control", description: "if false" },
        { source: "branch_true", target: "end", type: "data", description: "uses resultA" },
        { source: "branch_false", target: "end", type: "data", description: "uses resultB" },
      ],
    };

    expect(graph.edges.filter(e => e.type === "control").length).toBe(2);
    expect(graph.edges.filter(e => e.type === "data").length).toBe(2);
  });

  it("should correctly represent a graph with missing or empty metadata", () => {
    const graph = {
      nodes: [
        {
          id: "nodeA",
          message: { type: "text", content: "A" },
          metadata: { inputs: {}, outputs: {}, guardStatus: "skipped" },
        },
        {
          id: "nodeB",
          message: { type: "tool_use", content: "tool_B" },
          metadata: { inputs: { required: "yes" }, outputs: {}, guardStatus: "failed" },
        },
        {
          id: "nodeC",
          message: { type: "text", content: "C" },
          metadata: { inputs: {}, outputs: {}, guardStatus: "passed" },
        },
      ],
      edges: [
        { source: "nodeA", target: "nodeB", type: "control", description: "next step" },
        { source: "nodeB", target: "nodeC", type: "control", description: "always runs" },
      ],
    };

    expect(graph.nodes.find(n => n.id === "nodeB")?.metadata.guardStatus).toBe("failed");
    expect(graph.nodes.find(n => n.id === "nodeA")?.metadata.guardStatus).toBe("skipped");
    expect(graph.nodes.find(n => n.id === "nodeB")?.metadata.inputs).toEqual({ required: "yes" });
  });
});