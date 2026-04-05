import { describe, it, expect } from "vitest";
import {
  ToolCallDependencyGraphVisualizerMermaidAdvancedV35,
} from "../src/graph/tool-call-dependency-graph-visualizer-mermaid-advanced-v35";

describe("ToolCallDependencyGraphVisualizerMermaidAdvancedV35", () => {
  it("should generate a basic graph structure for a single tool call", () => {
    const metadata: any = {
      message: {
        role: "user",
        content: [
          { type: "text", content: "Call tool A" },
        ],
      },
      tool_use_id: "tool_use_1",
      tool_name: "toolA",
      input: { param1: "value1" },
      status: "success",
      group: "user_interaction",
    };
    const graphVisualizer = new ToolCallDependencyGraphVisualizerMermaidAdvancedV35();
    const mermaidCode = graphVisualizer.visualize([
      {
        id: "node1",
        label: "User Input",
        metadata: metadata,
      },
      {
        id: "node2",
        label: "Tool Call A",
        metadata: metadata,
      },
    ]);

    expect(mermaidCode).toContain("graph TD");
    expect(mermaidCode).toContain("node1[User Input]");
    expect(mermaidCode).toContain("node2[Tool Call A]");
    expect(mermaidCode).toContain("node1 --> node2");
  });

  it("should handle multiple sequential tool calls correctly", () => {
    const metadata1: any = {
      message: { role: "user", content: [{ type: "text", content: "First call" }] },
      tool_use_id: "tool_use_1",
      tool_name: "toolA",
      input: {},
      status: "success",
      group: "group1",
    };
    const metadata2: any = {
      message: { role: "assistant", content: [{ type: "text", content: "Tool result" }] },
      tool_use_id: "tool_use_2",
      tool_name: "toolB",
      input: {},
      status: "success",
      group: "group2",
    };

    const graphVisualizer = new ToolCallDependencyGraphVisualizerMermaidAdvancedV35();
    const mermaidCode = graphVisualizer.visualize([
      { id: "start", label: "Start", metadata: { message: { role: "user", content: [{ type: "text", content: "Start" }] }, tool_use_id: "t1", tool_name: "tA", input: {}, status: "success", group: "g1" } },
      { id: "callA", label: "Call Tool A", metadata: { message: { role: "user", content: [{ type: "text", content: "Call A" }] }, tool_use_id: "t1", tool_name: "tA", input: {}, status: "success", group: "g1" } },
      { id: "resultB", label: "Result B", metadata: { message: { role: "assistant", content: [{ type: "text", content: "Result" }] }, tool_use_id: "t2", tool_name: "tB", input: {}, status: "success", group: "g2" } },
    ]);

    expect(mermaidCode).toContain("callA");
    expect(mermaidCode).toContain("resultB");
    expect(mermaidCode).toContain("start --> callA");
    expect(mermaidCode).toContain("callA --> resultB");
  });

  it("should generate distinct nodes for different tool uses in the same group", () => {
    const metadata1: any = {
      message: { role: "user", content: [{ type: "text", content: "Call tool X" }] },
      tool_use_id: "tool_use_x",
      tool_name: "toolX",
      input: { param: 1 },
      status: "success",
      group: "group_x",
    };
    const metadata2: any = {
      message: { role: "user", content: [{ type: "text", content: "Call tool Y" }] },
      tool_use_id: "tool_use_y",
      tool_name: "toolY",
      input: { param: 2 },
      status: "success",
      group: "group_x",
    };

    const graphVisualizer = new ToolCallDependencyGraphVisualizerMermaidAdvancedV35();
    const mermaidCode = graphVisualizer.visualize([
      { id: "nodeX", label: "Tool X Call", metadata: metadata1 },
      { id: "nodeY", label: "Tool Y Call", metadata: metadata2 },
    ]);

    expect(mermaidCode).toContain("nodeX");
    expect(mermaidCode).toContain("nodeY");
    expect(mermaidCode).toContain("nodeX --> nodeY");
  });
});