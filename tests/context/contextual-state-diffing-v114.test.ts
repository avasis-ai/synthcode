import { describe, it, expect } from "vitest";
import { ContextualStateDiffingV114 } from "../src/context/contextual-state-diffing-v114";

describe("ContextualStateDiffingV114", () => {
  it("should correctly calculate diff when state changes are simple and causal", () => {
    const diffing = new ContextualStateDiffingV114();
    const initialState = {
      messages: [
        { type: "user", content: "Hello" },
        { type: "assistant", content: "Hi there!" },
      ],
      metadata: {
        session_id: "abc-123",
        turn: 2,
      },
    };
    const newState = {
      messages: [
        { type: "user", content: "Hello" },
        { type: "assistant", content: "Hi there!" },
        { type: "user", content: "How are you?" },
      ],
      metadata: {
        session_id: "abc-123",
        turn: 3,
      },
    };

    const result = diffing.calculateDiff(initialState, newState);

    expect(result.diff).toEqual({
      messages: [
        { type: "user", content: "How are you?" },
      ],
      metadata: {
        turn: 3,
      },
    });
    expect(result.causal_context.preceding_event_type).toBe("user");
    expect(result.causal_context.temporal_ordering_violation).toBe(false);
    expect(result.causal_context.causal_dependency_change).toBe(false);
  });

  it("should detect a temporal ordering violation when messages are out of sequence", () => {
    const diffing = new ContextualStateDiffingV114();
    const initialState = {
      messages: [
        { type: "user", content: "Start" },
        { type: "assistant", content: "Response" },
      ],
      metadata: {
        session_id: "xyz",
        turn: 2,
      },
    };
    // Simulate an out-of-order update (e.g., a tool result arriving before the assistant's turn)
    const newState = {
      messages: [
        { type: "user", content: "Start" },
        { type: "tool_result", content: "Tool output", source: "tool_a" }, // Out of order
        { type: "assistant", content: "Response" },
      ],
      metadata: {
        session_id: "xyz",
        turn: 3,
      },
    };

    const result = diffing.calculateDiff(initialState, newState);

    expect(result.diff).toEqual({
      messages: [
        { type: "tool_result", content: "Tool output", source: "tool_a" },
      ],
      metadata: {
        turn: 3,
      },
    });
    expect(result.causal_context.preceding_event_type).toBe("tool_result");
    expect(result.causal_context.temporal_ordering_violation).toBe(true);
    expect(result.causal_context.causal_dependency_change).toBe(false);
  });

  it("should detect a change in causal dependency when metadata indicates a context shift", () => {
    const diffing = new ContextualStateDiffingV114();
    const initialState = {
      messages: [
        { type: "user", content: "Initial query" },
      ],
      metadata: {
        session_id: "session-A",
        turn: 1,
        context_scope: "general",
      },
    };
    const newState = {
      messages: [
        { type: "user", content: "Initial query" },
        { type: "user", content: "Follow up on specific topic X" },
      ],
      metadata: {
        session_id: "session-A",
        turn: 2,
        context_scope: "topic_x", // Change in scope implies dependency change
      },
    };

    const result = diffing.calculateDiff(initialState, newState);

    expect(result.diff).toEqual({
      messages: [
        { type: "user", content: "Follow up on specific topic X" },
      ],
      metadata: {
        context_scope: "topic_x",
        turn: 2,
      },
    });
    expect(result.causal_context.preceding_event_type).toBe("user");
    expect(result.causal_context.temporal_ordering_violation).toBe(false);
    expect(result.causal_context.causal_dependency_change).toBe(true);
  });
});