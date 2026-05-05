import { describe, it, expect } from "vitest";
import {
  AdvancedContextPayload,
  ToolCallContext,
  validateToolCall,
} from "../src/validation/contextual-tool-call-validator-context-enricher-v169-advanced-advanced";

describe("validateToolCall", () => {
  it("should return true for a valid tool call with basic context", async () => {
    const mockContext: ToolCallContext = {
      history: [
        { role: "user", content: "What is the capital of France?" } as any,
      ],
      currentState: {
        user_id: "123",
      },
      advancedContext: {
        recentIntentShift: { source: "A", target: "B", confidence: 0.9 },
        graphConstraints: { "topic": "geography" },
        crossStepDependencies: { "step1": "step2" },
      },
    };
    const mockToolCall = {
      toolName: "get_location",
      arguments: { country: "France" },
    };
    await expect(validateToolCall(mockToolCall, mockContext)).resolves.toBe(true);
  });

  it("should return false if the tool call arguments are missing required fields", async () => {
    const mockContext: ToolCallContext = {
      history: [],
      currentState: {},
      advancedContext: {},
    };
    const mockToolCall = {
      toolName: "get_location",
      arguments: { country: undefined }, // Missing required field
    };
    await expect(validateToolCall(mockToolCall, mockContext)).resolves.toBe(false);
  });

  it("should handle missing advanced context gracefully", async () => {
    const mockContext: ToolCallContext = {
      history: [
        { role: "user", content: "Tell me about AI." } as any,
      ],
      currentState: {
        user_id: "456",
      },
      advancedContext: undefined, // Missing advanced context
    };
    const mockToolCall = {
      toolName: "search_web",
      arguments: { query: "AI trends" },
    };
    await expect(validateToolCall(mockToolCall, mockContext)).resolves.toBe(true);
  });
});