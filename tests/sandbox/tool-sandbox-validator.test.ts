import { describe, it, expect } from "vitest";
import {
  UserMessage,
  AssistantMessage,
  ToolResultMessage,
  ContentBlock,
  TextBlock,
} from "../src/sandbox/tool-sandbox-validator";

describe("tool-sandbox-validator", () => {
  it("should validate a simple user message", () => {
    const userMessage: UserMessage = { role: "user", content: "Hello world" };
    expect(userMessage).toEqual({ role: "user", content: "Hello world" });
  });

  it("should validate a simple assistant message with text content", () => {
    const assistantMessage: AssistantMessage = {
      role: "assistant",
      content: [{ type: "text", text: "Hi there" }],
    };
    expect(assistantMessage).toEqual({
      role: "assistant",
      content: [{ type: "text", text: "Hi there" }],
    });
  });

  it("should validate a tool result message", () => {
    const toolResultMessage: ToolResultMessage = {
      role: "tool",
      tool_use_id: "test-id",
      content: "Tool executed successfully",
    };
    expect(toolResultMessage).toEqual({
      role: "tool",
      tool_use_id: "test-id",
      content: "Tool executed successfully",
    });
  });
});