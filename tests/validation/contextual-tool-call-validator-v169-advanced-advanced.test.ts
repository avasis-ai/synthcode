import { describe, it, expect } from "vitest";
import { ContextualToolCallValidator } from "../src/validation/contextual-tool-call-validator-v169-advanced-advanced";
import { ToolUseBlock, Message } from "../src/validation/types";

describe("ContextualToolCallValidator", () => {
  it("should return valid when the tool call matches the current intent and context", () => {
    const validator = new ContextualToolCallValidator();
    const context: { history: Message[]; currentIntent: string; currentState: Record<string, any>; lastNSteps: Message[] } = {
      history: [],
      currentIntent: "get_weather",
      currentState: { location: "New York" },
      lastNSteps: [],
    };
    const toolCall: ToolUseBlock = {
      toolName: "get_weather",
      arguments: { location: "New York" },
    };
    const result = validator.validate(context, toolCall);
    expect(result.isValid).toBe(true);
  });

  it("should return invalid when the tool call does not match the current intent", () => {
    const validator = new ContextualToolCallValidator();
    const context: { history: Message[]; currentIntent: string; currentState: Record<string, any>; lastNSteps: Message[] } = {
      history: [],
      currentIntent: "get_weather",
      currentState: { location: "New York" },
      lastNSteps: [],
    };
    const toolCall: ToolUseBlock = {
      toolName: "send_email",
      arguments: { recipient: "test@example.com" },
    };
    const result = validator.validate(context, toolCall);
    expect(result.isValid).toBe(false);
    expect(result.reason).toContain("Tool call does not match the current intent");
  });

  it("should return invalid when required arguments are missing for the tool call", () => {
    const validator = new ContextualToolCallValidator();
    const context: { history: Message[]; currentIntent: string; currentState: Record<string, any>; lastNSteps: Message[] } = {
      history: [],
      currentIntent: "create_user",
      currentState: { username: "testuser" },
      lastNSteps: [],
    };
    const toolCall: ToolUseBlock = {
      toolName: "create_user",
      arguments: { email: "test@example.com" }, // Missing required 'password'
    };
    const result = validator.validate(context, toolCall);
    expect(result.isValid).toBe(false);
    expect(result.reason).toContain("Missing required argument: password");
  });
});