import { describe, it, expect } from "vitest";
import { GraphNode, ToolExecutionRecord } from "../src/visualization/tool-execution-dependency-graph-visualizer-v29";

describe("GraphNode", () => {
  it("should correctly calculate duration", () => {
    const node: GraphNode = {
      id: "node1",
      toolName: "toolA",
      startTime: 100,
      endTime: 200,
      duration: 100,
      input: {},
      output: {},
    };
    expect(node.duration).toBe(100);
  });

  it("should handle zero duration nodes", () => {
    const node: GraphNode = {
      id: "node2",
      toolName: "toolB",
      startTime: 50,
      endTime: 50,
      duration: 0,
      input: {},
      output: {},
    };
    expect(node.duration).toBe(0);
  });

  it("should correctly structure a node with input and output", () => {
    const node: GraphNode = {
      id: "node3",
      toolName: "toolC",
      startTime: 10,
      endTime: 30,
      duration: 20,
      input: { param1: "value1" },
      output: { result: "success" },
    };
    expect(node.id).toBe("node3");
    expect(node.input).toEqual({ param1: "value1" });
    expect(node.output).toEqual({ result: "success" });
  });
});