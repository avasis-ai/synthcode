import { describe, it, expect } from "vitest";
import { ContextualValidator } from "../src/validation/contextual-tool-call-validator-v164";
import { Message, ToolUseBlock } from "../src/validation/types";

describe("ContextualValidator", () => {
  it("should return true for a valid tool call based on context", () => {
    const messages: Message[] = [
      { role: "user", content: "What is the weather like in London today?" },
      { role: "assistant", content: "I can check the weather for you." },
    ];
    const toolCall: ToolUseBlock = {
      name: "get_current_weather",
      arguments: '{"location": "London", "unit": "celsius"}',
    };
    const result = ContextualValidator(messages, toolCall);
    expect(result.isValid).toBe(true);
    expect(result.message).toContain("valid");
  });

  it("should return false if the tool call arguments do not match the context", () => {
    const messages: Message[] = [
      { role: "user", content: "What is the capital of France?" },
    ];
    const toolCall: ToolUseBlock = {
      name: "get_current_weather",
      arguments: '{"location": "Paris", "unit": "fahrenheit"}', // Wrong arguments for the question
    };
    const result = ContextualValidator(messages, toolCall);
    expect(result.isValid).toBe(false);
    expect(result.message).toContain("mismatch");
  });

  it("should return false if the tool name is completely irrelevant to the conversation", () => {
    const messages: Message[] = [
      { role: "user", content: "Can you summarize the last chapter of the book?" },
    ];
    const toolCall: ToolUseBlock = {
      name: "get_current_weather", // Irrelevant tool
      arguments: '{}',
    };
    const result = ContextualValidator(messages, toolCall);
    expect(result.isValid).toBe(false);
    expect(result.message).toContain("irrelevant");
  });
});