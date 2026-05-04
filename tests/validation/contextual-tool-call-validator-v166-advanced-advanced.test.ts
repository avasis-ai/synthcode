import { describe, it, expect } from "vitest";
import { ContextualToolCallValidator } from "../src/validation/contextual-tool-call-validator-v166-advanced-advanced";

describe("ContextualToolCallValidator", () => {
  it("should return valid when tool calls are appropriate for the context", () => {
    const validator = new ContextualToolCallValidator();
    const history: Message[] = [
      { role: "user", content: [{ type: "text", text: "What is the weather like in London?" }] }
    ];
    const state: Record<string, unknown> = {};
    const constraints: Record<string, any> = {};
    const toolCalls: ToolUseBlock[] = [
      { toolName: "get_weather", arguments: { location: "London" } }
    ];

    const result = validator.validate(history, state, constraints, toolCalls);
    expect(result.isValid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it("should return invalid when tool calls are unexpected given the history", () => {
    const validator = new ContextualToolCallValidator();
    const history: Message[] = [
      { role: "user", content: [{ type: "text", text: "Hello, how are you?" }] }
    ];
    const state: Record<string, unknown> = {};
    const constraints: Record<string, any> = {};
    const toolCalls: ToolUseBlock[] = [
      { toolName: "get_weather", arguments: { location: "London" } }
    ];

    const result = validator.validate(history, state, constraints, toolCalls);
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain("Tool calls are not appropriate for the current conversation context.");
  });

  it("should return valid when tool calls match explicit constraints", () => {
    const validator = new ContextualToolCallValidator();
    const history: Message[] = [
      { role: "user", content: [{ type: "text", text: "Book a flight to Paris." }] }
    ];
    const state: Record<string, unknown> = { user_id: "123" };
    const constraints: Record<string, any> = { allowed_tools: ["book_flight"] };
    const toolCalls: ToolUseBlock[] = [
      { toolName: "book_flight", arguments: { destination: "Paris" } }
    ];

    const result = validator.validate(history, state, constraints, toolCalls);
    expect(result.isValid).toBe(true);
    expect(result.errors).toEqual([]);
  });
});