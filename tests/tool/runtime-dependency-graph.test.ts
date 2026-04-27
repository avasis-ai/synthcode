import { describe, it, expect } from "vitest";
import { ToolExecutionDependencyGraphBuilder } from "../src/tool/runtime-dependency-graph";

describe("ToolExecutionDependencyGraphBuilder", () => {
  it("should initialize with empty graph", () => {
    const builder = new ToolExecutionDependencyGraphBuilder();
    expect(builder.graph.nodes.size).toBe(0);
    expect(builder.graph.edges.size).toBe(0);
  });

  it("should add a node correctly", () => {
    const builder = new ToolExecutionDependencyGraphBuilder();
    builder.addNode("toolA", { toolCallId: "call1", inputs: { param1: "val1" }, outputs: { result: "out1" } });

    expect(builder.graph.nodes.has("toolA")).toBe(true);
    const node = builder.graph.nodes.get("toolA")!;
    expect(node.toolCallId).toBe("call1");
    expect(node.inputs).toEqual({ param1: "val1" });
    expect(node.outputs).toEqual({ result: "out1" });
  });

  it("should add an edge correctly", () => {
    const builder = new ToolExecutionDependencyGraphBuilder();
    builder.addEdge("toolA", "toolB", "toolA.outputs.result");

    expect(builder.graph.edges.has("toolA_toolB")).toBe(true);
    const edge = builder.graph.edges.get("toolA_toolB")!;
    expect(edge.source).toBe("toolA");
    expect(edge.target).toBe("toolB");
    expect(edge.dataPath).toBe("toolA.outputs.result");
  });
});