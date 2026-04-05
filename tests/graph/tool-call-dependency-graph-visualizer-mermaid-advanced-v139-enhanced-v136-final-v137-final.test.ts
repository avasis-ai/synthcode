import { describe, it, expect } from "vitest";
import {
  DependencyGraphContext,
  GraphNode,
  DependencyGraphVisualizer,
} from "../src/graph/tool-call-dependency-graph-visualizer-mermaid-advanced-v139-enhanced-v136-final-v137-final";

describe("DependencyGraphVisualizer", () => {
  it("should generate a basic graph for a simple sequence of messages", () => {
    const context: DependencyGraphContext = {
      messages: [
        { role: "user", content: "Start" } as UserMessage,
        { role: "assistant", content: "Response" } as AssistantMessage,
      ],
      graphNodes: [
        {
          id: "start",
          type: "start",
          description: "User input",
        },
        {
          id: "response",
          type: "end",
          description: "Final response",
        },
        {
          id: "start_to_response",
          type: "conditional",
          description: "Direct flow",
          next: { condition: "success", nodeId: "response" },
        },
      ],
    };

    const visualizer = new DependencyGraphVisualizer(context);
    const mermaidDiagram = visualizer.generateMermaid();

    expect(mermaidDiagram).toContain("graph TD");
    expect(mermaidDiagram).toContain("start[User input]");
    expect(mermaidDiagram).toContain("response[Final response]");
    expect(mermaidDiagram).toContain("start_to_response -- success --> response");
  });

  it("should handle a tool call dependency graph", () => {
    const context: DependencyGraphContext = {
      messages: [
        { role: "user", content: "Call tool A" } as UserMessage,
        { role: "assistant", content: "Tool call A" } as AssistantMessage,
        { role: "tool_result", content: "Result A" } as ToolResultMessage,
        { role: "assistant", content: "Final answer" } as AssistantMessage,
      ],
      graphNodes: [
        {
          id: "start",
          type: "start",
          description: "User input",
        },
        {
          id: "tool_call_a",
          type: "tool_call",
          description: "Tool A call",
          inputs: { toolName: "A" },
          outputs: { result: "A_result" },
          next: { condition: "success", nodeId: "tool_result_a" },
        },
        {
          id: "tool_result_a",
          type: "conditional",
          description: "Tool A result received",
          next: { condition: "success", nodeId: "end" },
        },
        {
          id: "end",
          type: "end",
          description: "Final answer",
        },
      ],
    };

    const visualizer = new DependencyGraphVisualizer(context);
    const mermaidDiagram = visualizer.generateMermaid();

    expect(mermaidDiagram).toContain("tool_call_a[Tool A call]");
    expect(mermaidDiagram).toContain("tool_result_a[Tool A result received]");
    expect(mermaidDiagram).toContain("tool_call_a --> tool_result_a");
    expect(mermaidDiagram).toContain("tool_result_a --> end");
  });

  it("should correctly represent a conditional branch", () => {
    const context: DependencyGraphContext = {
      messages: [
        { role: "user", content: "Check condition" } as UserMessage,
      ],
      graphNodes: [
        {
          id: "start",
          type: "start",
          description: "User input",
        },
        {
          id: "condition_node",
          type: "conditional",
          description: "Check condition",
          next: { condition: "true", nodeId: "true_path" },
        },
        {
          id: "true_path",
          type: "conditional",
          description: "True path taken",
          next: { condition: "success", nodeId: "end" },
        },
        {
          id: "false_path",
          type: "conditional",
          description: "False path taken",
          next: { condition: "success", nodeId: "end" },
        },
        {
          id: "end",
          type: "end",
          description: "End",
        },
      ],
    };

    const visualizer = new DependencyGraphVisualizer(context);
    const mermaidDiagram = visualizer.generateMermaid();

    expect(mermaidDiagram).toContain("condition_node[Check condition]");
    expect(mermaidDiagram).toContain("condition_node -- true --> true_path");
    expect(mermaidDiagram).toContain("condition_node -- false --> false_path");
    expect(mermaidDiagram).toContain("true_path --> end");
    expect(mermaidDiagram).toContain("false_path --> end");
  });
});