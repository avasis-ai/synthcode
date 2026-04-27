import { describe, it, expect, vi } from "vitest";
import { ExecutionState, ToolExecutionState } from "../src/tool/execution-state-tracker";

describe("ToolExecutionStateTracker", () => {
  it("should initialize with correct default state", () => {
    const initialState: ToolExecutionState = {
      executionId: "test-id",
      currentState: ExecutionState.PENDING_INPUT,
      startTime: new Date(),
      lastUpdated: new Date(),
      context: {},
      history: [{
        timestamp: new Date(),
        state: ExecutionState.PENDING_INPUT,
        context: {},
      }],
    };
    expect(initialState.executionId).toBe("test-id");
    expect(initialState.currentState).toBe(ExecutionState.PENDING_INPUT);
    expect(initialState.history.length).toBe(1);
  });

  it("should update state and history correctly when moving to EXECUTING", () => {
    const initial: ToolExecutionState = {
      executionId: "test-id",
      currentState: ExecutionState.PENDING_INPUT,
      startTime: new Date(),
      lastUpdated: new Date(),
      context: { input: "data" },
      history: [{
        timestamp: new Date(),
        state: ExecutionState.PENDING_INPUT,
        context: { input: "data" },
      }],
    };

    const updatedState: ToolExecutionState = {
      ...initial,
      currentState: ExecutionState.EXECUTING,
      lastUpdated: new Date(),
      context: { input: "data", step: "executing" },
      history: [
        ...initial.history,
        {
          timestamp: new Date(),
          state: ExecutionState.EXECUTING,
          context: { input: "data", step: "executing" },
        },
      ],
    };

    expect(updatedState.currentState).toBe(ExecutionState.EXECUTING);
    expect(updatedState.history.length).toBe(2);
    expect(updatedState.history[1].state).toBe(ExecutionState.EXECUTING);
  });

  it("should correctly record the final state upon completion", () => {
    const initial: ToolExecutionState = {
      executionId: "test-id",
      currentState: ExecutionState.EXECUTING,
      startTime: new Date(),
      lastUpdated: new Date(),
      context: { result: null },
      history: [{
        timestamp: new Date(),
        state: ExecutionState.EXECUTING,
        context: { result: null },
      }],
    };

    const completedState: ToolExecutionState = {
      ...initial,
      currentState: ExecutionState.COMPLETED,
      lastUpdated: new Date(),
      context: { result: "success" },
      history: [
        ...initial.history,
        {
          timestamp: new Date(),
          state: ExecutionState.COMPLETED,
          context: { result: "success" },
        },
      ],
    };

    expect(completedState.currentState).toBe(ExecutionState.COMPLETED);
    expect(completedState.history.length).toBe(2);
    expect(completedState.history[1].state).toBe(ExecutionState.COMPLETED);
  });
});