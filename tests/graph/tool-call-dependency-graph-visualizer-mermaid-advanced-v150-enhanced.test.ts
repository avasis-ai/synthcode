import { describe, it, expect } from "vitest";
import { ToolCallDependencyGraphVisualizer } from "../src/graph/tool-call-dependency-graph-visualizer-mermaid-advanced-v150-enhanced";

describe("ToolCallDependencyGraphVisualizer", () => {
  it("should correctly build a simple linear graph from message blocks", () => {
    const visualizer = new ToolCallDependencyGraphVisualizer();
    const nodes: GraphNode[] = [
      { id: "node1", type: "message", content: { text: "Start" } },
      { id: "node2", type: "message", content: { text: "Next step" } },
    ];
    visualizer.addNodes(nodes);
    const graph = visualizer.generateMermaidGraph();

    expect(graph).toContain("graph TD");
    expect(graph).toContain("node1[Start]");
    expect(graph).toContain("node2[Next step]");
    expect(graph).toContain("node1 --> node2");
  });

  it("should handle a graph with a flow control node and conditional paths", () => {
    const visualizer = new ToolCallDependencyGraphVisualizer();
    const nodes: GraphNode[] = [
      { id: "start", type: "message", content: { text: "Start process" } },
      { id: "condition", type: "flow_control", content: null, condition: "success" },
      { id: "success_path", type: "message", content: { text: "Success branch" } },
      { id: "failure_path", type: "message", content: { text: "Failure branch" } },
    ];
    // Manually setting up the structure for testing the flow control logic
    const flowControlNode: FlowControlNode = {
      id: "condition",
      type: "flow_control",
      content: null,
      nextNodes: {
        "success": "success_path",
        "failure": "failure_path",
      },
    };
    const allNodes: GraphNode[] = [
      { id: "start", type: "message", content: { text: "Start process" } },
      flowControlNode,
      { id: "success_path", type: "message", content: { text: "Success branch" } },
      { id: "failure_path", type: "message", content: { text: "Failure branch" } },
    ];
    visualizer.addNodes(allNodes);
    // Mocking the internal structure setup for this specific test case if necessary, 
    // but relying on addNodes and assuming the visualizer processes the flow_control type correctly.
    
    const graph = visualizer.generateMermaidGraph();

    expect(graph).toContain("condition{");
    expect(graph).toContain("success --> success_path");
    expect(graph).toContain("failure --> failure_path");
  });

  it("should generate a graph structure including tool use nodes", () => {
    const visualizer = new ToolCallDependencyGraphVisualizer();
    const nodes: GraphNode[] = [
      { id: "start", type: "message", content: { text: "Start" } },
      { id: "tool_call", type: "tool_use", content: { toolName: "api", args: {} } },
      { id: "end", type: "message", content: { text: "Finished" } },
    ];
    // Assuming ToolUseBlock structure is handled by the visualizer
    const toolUseNode: ToolUseBlock = {
        id: "tool_call",
        type: "tool_use",
        content: { toolName: "api", args: {} }
    } as any; // Casting for simplicity in test setup
    
    const allNodes: GraphNode[] = [
        { id: "start", type: "message", content: { text: "Start" } },
        toolUseNode,
        { id: "end", type: "message", content: { text: "Finished" } },
    ];

    visualizer.addNodes(allNodes);
    const graph = visualizer.generateMermaidGraph();

    expect(graph).toContain("tool_call[Tool Use: api]");
    expect(graph).toContain("start --> tool_call");
    expect(graph).toContain("tool_call --> end");
  });
});