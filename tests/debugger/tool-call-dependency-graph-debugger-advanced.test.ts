import { describe, it, expect } from "vitest";
import {
  ToolCallGraphDebuggerAdvanced,
  DebuggerState,
} from "../src/debugger/tool-call-dependency-graph-debugger-advanced";

describe("ToolCallGraphDebuggerAdvanced", () => {
  it("should initialize with correct default state", () => {
    const debuggerInstance = new ToolCallGraphDebuggerAdvanced();
    expect(debuggerInstance.getState()).toEqual({
      currentNodeId: null,
      graph: new Map(),
      history: [],
      currentStep: 0,
    });
  });

  it("should add a new node to the graph correctly", () => {
    const debuggerInstance = new ToolCallGraphDebuggerAdvanced();
    const nodeId = "node-1";
    const node: ToolCallGraphNode = {
      id: nodeId,
      name: "toolA",
      status: "pending",
      input: { param1: "value1" },
      dependencies: [],
    };
    debuggerInstance.addNode(node);
    const state = debuggerInstance.getState();
    expect(state.graph.get(nodeId)).toEqual(node);
    expect(state.graph.size).toBe(1);
  });

  it("should update node status and output when a tool call completes", () => {
    const debuggerInstance = new ToolCallGraphDebuggerAdvanced();
    const nodeId = "node-2";
    const initialNode: ToolCallGraphNode = {
      id: nodeId,
      name: "toolB",
      status: "pending",
      input: { param2: "value2" },
      dependencies: ["node-1"],
    };
    debuggerInstance.addNode(initialNode);

    const updatedNode: ToolCallGraphNode = {
      ...initialNode,
      status: "completed",
      output: { result: "success" },
    };
    debuggerInstance.updateNode(nodeId, updatedNode);

    const state = debuggerInstance.getState();
    const retrievedNode = state.graph.get(nodeId);
    expect(retrievedNode?.status).toBe("completed");
    expect(retrievedNode?.output).toEqual({ result: "success" });
  });
});