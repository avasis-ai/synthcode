import { describe, it, expect } from "vitest";
import { GraphContext, FlowControlNode } from "../src/graph/tool-call-dependency-graph-visualizer-mermaid-advanced-v134-enhanced-v7";
import { ToolCallDependencyGraphVisualizer } from "../src/graph/tool-call-dependency-graph-visualizer-mermaid-advanced-v134-enhanced-v7";

describe("ToolCallDependencyGraphVisualizer", () => {
  it("should generate a basic graph structure for simple tool calls", () => {
    const context: GraphContext = {
      messages: [{ role: "user", content: "Call tool A and then tool B" }],
      toolCalls: [{ id: "toolA", name: "toolA", arguments: {} }],
      flowControls: [],
    };
    const visualizer = new ToolCallDependencyGraphVisualizer(context);
    const graph = visualizer.generateGraph();
    expect(graph).toContain("A"); // Assuming tool names map to node IDs
    expect(graph).toContain("B");
  });

  it("should handle conditional flow control nodes correctly", () => {
    const context: GraphContext = {
      messages: [{ role: "user", content: "Check condition, then proceed" }],
      toolCalls: [{ id: "toolA", name: "toolA", arguments: {} }],
      flowControls: [
        {
          id: "cond1",
          type: "conditional",
          label: "Condition Check",
          description: "Check if user provided data",
          outgoingEdges: [
            { sourceId: "cond1", targetId: "toolA", condition: "success" },
            { sourceId: "cond1", targetId: "end", condition: "failure" },
          ],
        },
      ],
    };
    const visualizer = new ToolCallDependencyGraphVisualizer(context);
    const graph = visualizer.generateGraph();
    expect(graph).toContain("cond1");
    expect(graph).toContain("success");
    expect(graph).toContain("failure");
  });

  it("should correctly represent a loop structure", () => {
    const context: GraphContext = {
      messages: [{ role: "user", content: "Loop until stable" }],
      toolCalls: [{ id: "toolA", name: "toolA", arguments: {} }],
      flowControls: [
        {
          id: "loop1",
          type: "loop",
          label: "Loop Execution",
          description: "Repeat process until convergence",
          outgoingEdges: [
            { sourceId: "loop1", targetId: "toolA", condition: "continue" },
            { sourceId: "loop1", targetId: "end", condition: "exit" },
          ],
        },
      ],
    };
    const visualizer = new ToolCallDependencyGraphVisualizer(context);
    const graph = visualizer.generateGraph();
    expect(graph).toContain("loop1");
    expect(graph).toContain("continue");
    expect(graph).toContain("exit");
  });
});