import { describe, it, expect } from "vitest";
import { ContextualToolCallValidator } from "../src/validation/contextual-tool-call-validator-v167-advanced-advanced";
import { Message, UserMessage, AssistantMessage, ToolResultMessage, ContentBlock, ToolUseBlock, ThinkingBlock } from "../src/validation/types";

describe("ContextualToolCallValidator", () => {
  it("should validate a tool call when the context suggests a specific tool is needed", () => {
    const mockContext: ValidationContext = {
      history: [
        new UserMessage("What is the capital of France?"),
        new AssistantMessage("The capital of France is Paris. Would you like to know more about its history?"),
      ],
      currentGoal: "Provide historical context for Paris.",
      currentState: { location: "France" },
    };
    const validator = new ContextualToolCallValidator(mockContext);
    const toolCall = {
      toolName: "get_historical_info",
      toolInput: { city: "Paris", period: "medieval" },
    };
    // Assuming the validator has a method like validateToolCall
    // Since the full implementation isn't provided, we mock the expected behavior.
    const isValid = validator.validateToolCall(toolCall);
    expect(isValid).toBe(true);
  });

  it("should reject a tool call when the context is unrelated to the tool's purpose", () => {
    const mockContext: ValidationContext = {
      history: [
        new UserMessage("How do I bake a cake?"),
        new AssistantMessage("You'll need flour, sugar, and eggs."),
      ],
      currentGoal: "Baking instructions.",
      currentState: { ingredients: ["flour", "sugar", "eggs"] },
    };
    const validator = new ContextualToolCallValidator(mockContext);
    const toolCall = {
      toolName: "get_historical_info",
      toolInput: { city: "Rome", period: "ancient" },
    };
    const isValid = validator.validateToolCall(toolCall);
    expect(isValid).toBe(false);
  });

  it("should allow a tool call if the context is ambiguous but the tool call is generally valid", () => {
    const mockContext: ValidationContext = {
      history: [
        new UserMessage("Tell me about travel."),
        new AssistantMessage("I can help with travel plans. What are you interested in?"),
      ],
      currentGoal: "General travel planning.",
      currentState: { user_preferences: {} },
    };
    const validator = new ContextualToolCallValidator(mockContext);
    const toolCall = {
      toolName: "search_flights",
      toolInput: { origin: "JFK", destination: "LAX" },
    };
    const isValid = validator.validateToolCall(toolCall);
    expect(isValid).toBe(true);
  });
});