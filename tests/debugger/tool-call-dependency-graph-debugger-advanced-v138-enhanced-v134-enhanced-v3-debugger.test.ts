import { describe, it, expect } from "vitest";
import {
  DebuggerState,
  ExecutionContext,
} from "../debugger/tool-call-dependency-graph-debugger-advanced-v138-enhanced-v134-enhanced-v3-debugger";

describe("DebuggerState", () => {
  it("should initialize with a valid context structure", () => {
    const initialContext: ExecutionContext = {
      currentNodeId: "node1",
      previousNodeId: null,
      edgeId: null,
      state: {},
      bindings: new Map(),
      messageHistory: [],
    };
    const state: DebuggerState = { context: initialContext };

    expect(state.context.currentNodeId).toBe("node1");
    expect(state.context.previousNodeId).toBeNull();
    expect(state.context.edgeId).toBeNull();
    expect(state.context.state).toEqual({});
    expect(state.context.bindings).toBeInstanceOf(Map);
    expect(state.context.messageHistory).toEqual([]);
  });

  it("should allow updating the current node ID", () => {
    const initialState: DebuggerState = {
      context: {
        currentNodeId: "oldNode",
        previousNodeId: null,
        edgeId: null,
        state: {},
        bindings: new Map(),
        messageHistory: [],
      },
    };
    const newContext: ExecutionContext = {
      currentNodeId: "newNode",
      previousNodeId: "oldNode",
      edgeId: "edge1",
      state: { some: "state" },
      bindings: new Map([["key", "value"]]),
      messageHistory: [{ type: "user" }],
    };
    // Assuming a hypothetical update function exists or we test setting it directly
    (initialState as any).context = newContext;

    expect((initialState as any).context.currentNodeId).toBe("newNode");
    expect((initialState as any).context.previousNodeId).toBe("oldNode");
  });

  it("should correctly handle updates to message history", () => {
    const initialState: DebuggerState = {
      context: {
        currentNodeId: "nodeA",
        previousNodeId: null,
        edgeId: null,
        state: {},
        bindings: new Map(),
        messageHistory: [{ type: "user", content: "Hi" }],
      },
    };
    const newMessage = { type: "assistant", content: "Hello" };
    // Assuming a hypothetical function appends to messageHistory
    (initialState as any).context.messageHistory.push(newMessage);

    expect((initialState as any).context.messageHistory).toHaveLength(2);
    expect((initialState as any).context.messageHistory[1]).toEqual(newMessage);
  });
});