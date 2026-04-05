import { describe, it, expect } from "vitest";
import { ToolCallDependencyGraphDebuggerAdvancedV144 } from "../src/debugger/tool-call-dependency-graph-debugger-advanced-v144";

describe("ToolCallDependencyGraphDebuggerAdvancedV144", () => {
  it("should initialize correctly with default state", () => {
    const debuggerInstance = new ToolCallDependencyGraphDebuggerAdvancedV144();
    expect(debuggerInstance).toBeInstanceOf(ToolCallDependencyGraphDebuggerAdvancedV144);
  });

  it("should correctly set the initial state when provided", () => {
    const initialState: any = {
      currentStep: 0,
      totalSteps: 10,
      currentNodeId: "node1",
      edgeSourceId: "start",
      edgeTargetId: "node1",
      context: { initial: true },
      history: [],
    };
    const debuggerInstance = new ToolCallDependencyGraphDebuggerAdvancedV144(initialState);
    expect(debuggerInstance.getState()).toEqual(initialState);
  });

  it("should update the state when processing a new step", () => {
    const initialState: any = {
      currentStep: 0,
      totalSteps: 5,
      currentNodeId: "start",
      edgeSourceId: null,
      edgeTargetId: null,
      context: {},
      history: [],
    };
    const debuggerInstance = new ToolCallDependencyGraphDebuggerAdvancedV144(initialState);
    // Assuming there's a method to advance the state, we'll test a hypothetical update method
    // For this test, we'll simulate an update that increments the step count.
    const newState = debuggerInstance.advanceStep(1);
    expect(newState.currentStep).toBe(1);
    expect(newState.totalSteps).toBe(5);
  });
});