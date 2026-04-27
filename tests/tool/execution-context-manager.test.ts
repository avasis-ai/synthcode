import { describe, it, expect } from "vitest";
import { ToolExecutionContextManager } from "../src/tool/execution-context-manager";

describe("ToolExecutionContextManager", () => {
  it("should initialize with empty history and state", () => {
    const manager = new ToolExecutionContextManager();
    expect(manager.getHistory()).toEqual([]);
    expect(manager.getState()).toEqual({});
  });

  it("should add a tool call record to the history", () => {
    const manager = new ToolExecutionContextManager();
    const record: any = {
      toolName: "testTool",
      inputs: { query: "hello" },
      result: { success: true, output: "world" },
    };
    manager.addToolCallRecord(record);
    expect(manager.getHistory()).toHaveLength(1);
    expect(manager.getHistory()[0]).toEqual(record);
  });

  it("should update the final state correctly", () => {
    const manager = new ToolExecutionContextManager();
    const initialState = { user: "testUser" };
    manager.setFinalState(initialState);
    expect(manager.getState()).toEqual(initialState);

    const newState = { count: 1 };
    manager.updateState(newState);
    expect(manager.getState()).toEqual({ user: "testUser", count: 1 });
  });
});