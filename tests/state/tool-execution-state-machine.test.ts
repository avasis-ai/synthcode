import { describe, it, expect } from "vitest";
import { ToolExecutionStateMachine, ToolExecutionState } from "../src/state/tool-execution-state-machine";

describe("ToolExecutionStateMachine", () => {
  it("should transition from INITIALIZING to PENDING correctly", () => {
    const context: any = { message: {}, toolId: "test-tool", attemptCount: 0 };
    const stateMachine = new ToolExecutionStateMachine(context);
    stateMachine.transitionTo("PENDING");
    expect(stateMachine.getCurrentState()).toBe(ToolExecutionState.PENDING);
  });

  it("should transition from PENDING to EXECUTING when execution starts", () => {
    const context: any = { message: {}, toolId: "test-tool", attemptCount: 1 };
    const stateMachine = new ToolExecutionStateMachine(context);
    stateMachine.transitionTo("EXECUTING");
    expect(stateMachine.getCurrentState()).toBe(ToolExecutionState.EXECUTING);
  });

  it("should transition to COMPLETED or FAILED based on the result", () => {
    const context: any = { message: {}, toolId: "test-tool", attemptCount: 2 };
    const stateMachine = new ToolExecutionStateMachine(context);

    // Test successful completion
    stateMachine.transitionTo("COMPLETED");
    expect(stateMachine.getCurrentState()).toBe(ToolExecutionState.COMPLETED);

    // Reset and test failure
    const failedStateMachine = new ToolExecutionStateMachine(context);
    failedStateMachine.transitionTo("FAILED");
    expect(failedStateMachine.getCurrentState()).toBe(ToolExecutionState.FAILED);
  });
});