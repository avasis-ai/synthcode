import { describe, it, expect } from "vitest";
import {
  UserMessage,
  AssistantMessage,
  ToolResultMessage,
  ContentBlock,
  TextBlock,
  ToolUseBlock,
  ThinkingBlock,
} from "../synth-code-types";
import {
  GraphNode,
  DebuggerContext,
  DebuggerGraph,
} from "../tool-call-dependency-graph-debugger-advanced-v146-debugger-final-v139-debugger";

describe("ToolCallDependencyGraphDebuggerAdvanced", () => {
  it("should initialize context correctly with a basic graph", () => {
    const graph = new DebuggerGraph();
    const context = graph.createContext("STEP");

    expect(context.currentStep).toBe("STEP");
    expect(context.currentNodeId).toBeNull();
    expect(context.graphState.size).toBe(0);
  });

  it("should correctly add nodes and update dependencies", () => {
    const graph = new DebuggerGraph();
    const context = graph.createContext("STEP");

    const node1 = graph.addNode("user_msg_1", {
      type: "user",
      data: "Initial user message",
    });
    const node2 = graph.addNode("assistant_msg_1", {
      type: "assistant",
      data: "Assistant response",
      dependencies: ["user_msg_1"],
    });

    expect(graph.getNode("user_msg_1")).toBeDefined();
    expect(graph.getNode("assistant_msg_1")).toBeDefined();
    expect(graph.getNode("assistant_msg_1")?.dependencies).toEqual(["user_msg_1"]);
  });

  it("should allow transitioning state based on current node and edge", () => {
    const graph = new DebuggerGraph();
    const context = graph.createContext("STEP");

    // Simulate setting a current node and edge
    const nodeA = graph.addNode("nodeA", {
      type: "user",
      data: "Start",
    });
    const nodeB = graph.addNode("nodeB", {
      type: "assistant",
      data: "Next step",
      dependencies: ["nodeA"],
    });

    // Manually set context for testing transition logic
    (context as any).setCurrentNodeId("nodeA");
    (context as any).setCurrentEdge({ from: "nodeA", to: "nodeB" });

    // In a real scenario, this would trigger state updates, here we just check the setters
    expect(context.currentNodeId).toBe("nodeA");
    expect(context.currentEdge).toEqual({ from: "nodeA", to: "nodeB" });
  });
});