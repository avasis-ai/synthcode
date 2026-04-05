import { describe, it, expect } from "vitest";
import {
  generateMermaidGraph,
  DependencyEdge,
  ToolCallNode,
  FlowControlNode,
} from "../src/graph/tool-call-dependency-graph-visualizer-mermaid-advanced-v139-final-v138-final-v139-new-fix-v139-new-fix-v139-new-v1";

describe("generateMermaidGraph", () => {
  it("should generate a basic graph for a simple sequence of messages", () => {
    const toolCallNode: ToolCallNode = {
      id: "node1",
      message: {
        role: "user",
        content: [{ type: "text", text: "What is the capital of France?" }],
      },
      toolName: "get_location",
      toolUseId: "use1",
    };
    const flowControlNode: FlowControlNode = {
      id: "start",
      type: "start",
      description: "Start",
    };
    const endNode: FlowControlNode = {
      id: "end",
      type: "end",
      description: "End",
    };
    const edges: DependencyEdge[] = [
      { fromId: "start", toId: "node1", label: "Start", type: "-->" },
      { fromId: "node1", toId: "end", label: "Continue", type: "-->" },
    ];

    const mermaid = generateMermaidGraph(
      [flowControlNode, toolCallNode, endNode],
      edges
    );

    expect(mermaid).toContain("graph TD");
    expect(mermaid).toContain("start[Start]");
    expect(mermaid).toContain("node1[Tool Call: get_location]");
    expect(mermaid).toContain("end[End]");
    expect(mermaid).toContain("start --> node1");
    expect(mermaid).toContain("node1 --> end");
  });

  it("should generate a graph with a conditional branch", () => {
    const toolCallNode: ToolCallNode = {
      id: "nodeA",
      message: {
        role: "assistant",
        content: [{ type: "text", text: "The result is available." }],
      },
      toolName: "get_data",
      toolUseId: "useA",
    };
    const flowControlNode: FlowControlNode = {
      id: "start",
      type: "start",
      description: "Start",
    };
    const conditionalNode: FlowControlNode = {
      id: "condition",
      type: "conditional",
      description: "Check result",
      condition: "result_success",
    };
    const successNode: FlowControlNode = {
      id: "success",
      type: "end",
      description: "Success Path",
    };
    const failureNode: FlowControlNode = {
      id: "failure",
      type: "end",
      description: "Failure Path",
    };
    const edges: DependencyEdge[] = [
      { fromId: "start", toId: "nodeA", label: "Start", type: "-->" },
      { fromId: "nodeA", toId: "condition", label: "Process", type: "-->" },
      { fromId: "condition", toId: "success", label: "Success", type: "-->" },
      { fromId: "condition", toId: "failure", label: "Failure", type: "-->" },
    ];

    const mermaid = generateMermaidGraph(
      [flowControlNode, toolCallNode, conditionalNode, successNode, failureNode],
      edges
    );

    expect(mermaid).toContain("graph TD");
    expect(mermaid).toContain("start[Start]");
    expect(mermaid).toContain("nodeA[Tool Call: get_data]");
    expect(mermaid).toContain("condition{Check result}");
    expect(mermaid).toContain("start --> nodeA");
    expect(mermaid).toContain("nodeA --> condition");
    expect(mermaid).toContain("condition -- Success --> success");
    expect(mermaid).toContain("condition -- Failure --> failure");
  });

  it("should handle multiple tool calls in sequence", () => {
    const toolCallNode1: ToolCallNode = {
      id: "node1",
      message: {
        role: "user",
        content: [{ type: "text", text: "First step" }],
      },
      toolName: "tool1",
      toolUseId: "use1",
    };
    const toolCallNode2: ToolCallNode = {
      id: "node2",
      message: {
        role: "assistant",
        content: [{ type: "text", text: "Second step" }],
      },
      toolName: "tool2",
      toolUseId: "use2",
    };
    const flowControlNode: FlowControlNode = {
      id: "start",
      type: "start",
      description: "Start",
    };
    const endNode: FlowControlNode = {
      id: "end",
      type: "end",
      description: "End",
    };
    const edges: DependencyEdge[] = [
      { fromId: "start", toId: "node1", label: "Start", type: "-->" },
      { fromId: "node1", toId: "node2", label: "Call Tool 2", type: "-->" },
      { fromId: "node2", toId: "end", label: "Finish", type: "-->" },
    ];

    const mermaid = generateMermaidGraph(
      [flowControlNode, toolCallNode1, toolCallNode2, endNode],
      edges
    );

    expect(mermaid).toContain("graph TD");
    expect(mermaid).toContain("start[Start]");
    expect(mermaid).toContain("node1[Tool Call: tool1]");
    expect(mermaid).toContain("node2[Tool Call: tool2]");
    expect(mermaid).toContain("start --> node1");
    expect(mermaid).toContain("node1 --> node2");
    expect(mermaid).toContain("node2 --> end");
  });
});