import { describe, it, expect } from "vitest";
import { ToolExecutionDependencyGraphVisualizerV1 } from "../src/visualization/tool-execution-dependency-graph-visualizer-v1";
import { ToolExecutionRecord } from "../src/visualization/types";

describe("ToolExecutionDependencyGraphVisualizerV1", () => {
  it("should build nodes correctly for a simple linear dependency", () => {
    const records: ToolExecutionRecord[] = [
      { toolName: "toolA", output: "outputA", input: null },
      { toolName: "toolB", output: "outputB", input: "outputA" },
    ];
    const visualizer = new ToolExecutionDependencyGraphVisualizerV1(records);
    const nodes = visualizer.getNodes();

    expect(nodes).toHaveLength(2);
    expect(nodes[0].id).toBe("toolA");
    expect(nodes[1].id).toBe("toolB");
  });

  it("should handle multiple independent tools", () => {
    const records: ToolExecutionRecord[] = [
      { toolName: "toolA", output: "outputA", input: null },
      { toolName: "toolC", output: "outputC", input: null },
      { toolName: "toolB", output: "outputB", input: "outputA" },
    ];
    const visualizer = new ToolExecutionDependencyGraphVisualizerV1(records);
    const nodes = visualizer.getNodes();

    expect(nodes).toHaveLength(3);
    // Check if all expected nodes are present (order might vary depending on implementation, but we check content)
    const nodeIds = nodes.map(node => node.id);
    expect(nodeIds).toContain("toolA");
    expect(nodeIds).toContain("toolB");
    expect(nodeIds).toContain("toolC");
  });

  it("should build correct edges for a complex dependency chain", () => {
    const records: ToolExecutionRecord[] = [
      { toolName: "start", output: "out1", input: null },
      { toolName: "step1", output: "out2", input: "out1" },
      { toolName: "step2", output: "out3", input: "out2" },
      { toolName: "end", output: "out4", input: "out3" },
    ];
    const visualizer = new ToolExecutionDependencyGraphVisualizerV1(records);
    const edges = visualizer.getEdges();

    expect(edges).toHaveLength(3);
    // Check for the specific edges created
    const edgeStrings = edges.map(e => `${e.source} -> ${e.target}`);
    expect(edgeStrings).toContain("start -> step1");
    expect(edgeStrings).toContain("step1 -> step2");
    expect(edgeStrings).toContain("step2 -> end");
  });
});