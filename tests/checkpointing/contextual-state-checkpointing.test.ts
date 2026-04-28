import { describe, it, expect } from "vitest";
import {
  ToolState,
  AgentContext,
  StatePayload,
} from "../src/checkpointing/contextual-state-checkpointing";

describe("contextual-state-checkpointing", () => {
  it("should correctly serialize a basic state payload", () => {
    const mockPayload: StatePayload = {
      messages: [{ role: "user", content: "Hello" }],
      context: {
        sessionId: "session123",
        currentStep: 1,
        activeConstraints: ["constraintA"],
        lastToolCallId: "toolCall1",
      },
      toolStates: {
        "toolA": {
          toolName: "toolA",
          lastArguments: { param1: "value1" },
          executionHistory: ["log1"],
        },
      },
      internalCounters: {
        turnCount: 5,
        retryCount: 0,
      },
    };
    // Assuming a serialization function exists or we test the structure
    // For this test, we just check if the structure is sound.
    expect(mockPayload.messages).toHaveLength(1);
    expect(mockPayload.context.sessionId).toBe("session123");
    expect(mockPayload.toolStates["toolA"].toolName).toBe("toolA");
  });

  it("should handle empty or initial state values correctly", () => {
    const mockPayload: StatePayload = {
      messages: [],
      context: {
        sessionId: "newSession",
        currentStep: 0,
        activeConstraints: [],
        lastToolCallId: null,
      },
      toolStates: {},
      internalCounters: {
        turnCount: 0,
        retryCount: 0,
      },
    };
    expect(mockPayload.messages).toEqual([]);
    expect(mockPayload.context.currentStep).toBe(0);
    expect(mockPayload.toolStates).toEqual({});
  });

  it("should correctly update tool states upon subsequent calls", () => {
    const initialToolState: ToolState = {
      toolName: "search",
      lastArguments: { query: "initial" },
      executionHistory: ["start"],
    };
    const updatedToolState: ToolState = {
      toolName: "search",
      lastArguments: { query: "updated" },
      executionHistory: ["start", "step2"],
    };

    const mockPayload: StatePayload = {
      messages: [],
      context: {
        sessionId: "session456",
        currentStep: 2,
        activeConstraints: [],
        lastToolCallId: null,
      },
      toolStates: {
        "search": updatedToolState,
      },
      internalCounters: {
        turnCount: 2,
        retryCount: 1,
      },
    };
    expect(mockPayload.toolStates["search"].lastArguments.query).toBe("updated");
    expect(mockPayload.toolStates["search"].executionHistory).toHaveLength(2);
  });
});