import { describe, it, expect, vi } from "vitest";
import { AgentLifecycleStateManager } from "../src/state/agent-lifecycle-state-manager";

describe("AgentLifecycleStateManager", () => {
  it("should initialize with correct default state", () => {
    const manager = new AgentLifecycleStateManager();
    expect(manager.getCurrentState()).toEqual({
      messages: [],
      is_loading: false,
      is_error: false,
      current_step: "initial",
    });
  });

  it("should update state correctly when receiving a user message", () => {
    const manager = new AgentLifecycleStateManager();
    const userMessage = { role: "user", content: "Hello" };
    manager.addMessage(userMessage);

    const currentState = manager.getCurrentState();
    expect(currentState.messages).toHaveLength(1);
    expect(currentState.messages[0]).toEqual(userMessage);
    expect(currentState.current_step).toBe("user_message_added");
  });

  it("should update state correctly when processing an assistant response", () => {
    const manager = new AgentLifecycleStateManager();
    const userMessage = { role: "user", content: "What is the capital?" };
    manager.addMessage(userMessage);

    const assistantMessage = { role: "assistant", content: ["The capital is Paris."] };
    manager.addMessage(assistantMessage);

    const currentState = manager.getCurrentState();
    expect(currentState.messages).toHaveLength(2);
    expect(currentState.messages[1]).toEqual(assistantMessage);
    expect(currentState.current_step).toBe("assistant_response_added");
  });
});