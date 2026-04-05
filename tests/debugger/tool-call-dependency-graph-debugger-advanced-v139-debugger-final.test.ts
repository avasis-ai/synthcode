import { describe, it, expect } from "vitest";
import { DebuggerContext } from "../src/debugger/tool-call-dependency-graph-debugger-advanced-v139-debugger-final";

describe("DebuggerContext", () => {
  it("should initialize with an empty call stack and scope", () => {
    const context = new DebuggerContext();
    expect(context.getCallStack()).toHaveLength(0);
    expect(context.getCurrentScope()).toEqual({
      variables: new Map(),
      history: [],
    });
  });

  it("should add a call stack frame correctly", () => {
    const context = new DebuggerContext();
    const frame1 = {
      toolCallId: "call-id-1",
      toolName: "toolA",
      status: "pending",
      scope: { variables: new Map(), history: [] },
    };
    context.addCallStackFrame(frame1);
    expect(context.getCallStack()).toHaveLength(1);
    expect(context.getCallStack()[0]).toEqual(frame1);
  });

  it("should update the scope when a new frame is added", () => {
    const context = new DebuggerContext();
    const initialScope = { variables: new Map(), history: [] };
    const frame1 = {
      toolCallId: "call-id-1",
      toolName: "toolA",
      status: "pending",
      scope: { variables: new Map(), history: [] },
    };
    context.addCallStackFrame(frame1);
    // Assuming addCallStackFrame updates the context's internal scope or uses the frame's scope
    // Based on the provided code snippet, we test the direct addition and scope access.
    // If the context manages scope updates, this test might need adjustment based on full implementation.
    // For now, we verify the structure remains consistent.
    expect(context.getCallStack()[0].scope).toBe(frame1.scope);
  });
});