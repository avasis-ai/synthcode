import { describe, it, expect } from "vitest";
import {
  buildStructuredToolInputValidationContext,
  AgentContext,
  HistoryPayload,
  CurrentState,
  ContextPayload,
} from "../src/validation/structured-tool-input-validation-context-builder";

describe("buildStructuredToolInputValidationContext", () => {
  it("should build a context with minimal required data", () => {
    const history: Message[] = [
      { role: "user", content: "Hello" },
    ];
    const context: AgentContext = {
      current_state: { user_id: "123" },
      metadata: { session_id: "abc" },
    };
    const payload: ContextPayload = {
      history: history,
      current_state: { user_id: "123" },
    };

    const contextBuilder = buildStructuredToolInputValidationContext(
      payload,
      context
    );

    expect(contextBuilder).toBeDefined();
    expect(contextBuilder).toHaveProperty("history");
    expect(contextBuilder).toHaveProperty("current_state");
    expect(contextBuilder).toHaveProperty("metadata");
  });

  it("should correctly merge history and current state data", () => {
    const history: Message[] = [
      { role: "user", content: "What is the weather?" },
      { role: "assistant", content: "It is sunny." },
    ];
    const context: AgentContext = {
      current_state: { location: "New York" },
      metadata: { source: "api" },
    };
    const payload: ContextPayload = {
      history: history,
      current_state: { location: "New York" },
    };

    const contextBuilder = buildStructuredToolInputValidationContext(
      payload,
      context
    );

    expect(contextBuilder.history).toEqual(history);
    expect(contextBuilder.current_state).toEqual({
      ...payload.current_state,
      ...context.current_state,
    });
    expect(contextBuilder.metadata).toEqual(context.metadata);
  });

  it("should handle empty history and state gracefully", () => {
    const history: Message[] = [];
    const context: AgentContext = {
      current_state: {},
      metadata: {},
    };
    const payload: ContextPayload = {
      history: history,
      current_state: {},
    };

    const contextBuilder = buildStructuredToolInputValidationContext(
      payload,
      context
    );

    expect(contextBuilder).toBeDefined();
    expect(contextBuilder.history).toEqual([]);
    expect(contextBuilder.current_state).toEqual({});
    expect(contextBuilder.metadata).toEqual({});
  });
});