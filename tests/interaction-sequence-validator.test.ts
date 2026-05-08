import { describe, it, expect } from "vitest";
import {
  InteractionSequenceValidator,
  Message,
  UserMessage,
  AssistantMessage,
  ToolResultMessage,
} from "../src/interaction-sequence-validator";

describe("InteractionSequenceValidator", () => {
  it("should validate a simple user-assistant turn", () => {
    const messages: Message[] = [
      { role: "user"; content: "Hello" },
      { role: "assistant"; content: [{ type: "text", text: "Hi there!" }] },
    ];
    const validator = new InteractionSequenceValidator();
    expect(validator.isValid(messages)).toBe(true);
  });

  it("should validate a multi-turn conversation including a tool result", () => {
    const messages: Message[] = [
      { role: "user"; content: "What is the weather?" },
      { role: "assistant"; content: [{ type: "text", text: "Checking weather..." }] },
      { role: "tool"; tool_use_id: "tool_1", content: "Sunny", is_error: false },
      { role: "assistant"; content: [{ type: "text", text: "It's sunny today." }] },
    ];
    const validator = new InteractionSequenceValidator();
    expect(validator.isValid(messages)).toBe(true);
  });

  it("should fail validation if the sequence starts with an assistant message", () => {
    const messages: Message[] = [
      { role: "assistant"; content: [{ type: "text", text: "Hello" }] },
      { role: "user"; content: "Hi" },
    ];
    const validator = new InteractionSequenceValidator();
    expect(validator.isValid(messages)).toBe(false);
  });
});