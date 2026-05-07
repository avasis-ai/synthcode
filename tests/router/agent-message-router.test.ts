import { describe, it, expect } from "vitest";
import { routeMessage } from "../../../src/router/agent-message-router.js";

describe("routeMessage", () => {
  it("should correctly route a user message", () => {
    const userMessage = { role: "user", content: "Hello world" };
    const result = routeMessage(userMessage);
    expect(result).toEqual({ type: "user", message: userMessage });
  });

  it("should correctly route an assistant message", () => {
    const assistantMessage = { role: "assistant", content: [] };
    const result = routeMessage(assistantMessage);
    expect(result).toEqual({ type: "assistant", message: assistantMessage });
  });

  it("should correctly route a tool result message", () => {
    const toolResultMessage = { role: "tool", tool_use_id: "test-id", content: "Tool output" };
    const result = routeMessage(toolResultMessage);
    expect(result).toEqual({ type: "tool", message: toolResultMessage });
  });
});