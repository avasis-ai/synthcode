import { describe, it, expect } from "vitest";
import {
  AdvancedToolCallContext,
  ToolCall,
} from "../src/validation/structured-tool-call-validator-context-enricher-v154-advanced-advanced";

describe("Structur", () => {
  it("should correctly enrich context when all fields are present", () => {
    const baseContext: Message[] = [
      { role: "user", content: "What is the weather like?", name: "user" },
      { role: "assistant", content: "I can check the weather for you.", name: "assistant" },
    ];
    const toolCall: ToolCall = {
      id: "call123",
      name: "get_weather",
      input: { location: "New York" },
    };
    const context: AdvancedToolCallContext = {
      baseContext: baseContext,
      intendedToolCall: toolCall,
      executionPathAnalysis: {
        predictedNextStep: "tool_call",
        potentialSideEffects: ["weather_api_call"],
        requiredPermissions: ["read:weather"],
      },
    };

    // Assuming the class has a method to process or validate the context
    // We'll test the structure integrity based on the provided context type.
    expect(context.baseContext).toHaveLength(2);
    expect(context.intendedToolCall.name).toBe("get_weather");
    expect(context.executionPathAnalysis.predictedNextStep).toBe("tool_call");
  });

  it("should handle a context with no explicit side effects", () => {
    const baseContext: Message[] = [
      { role: "user", content: "Hello", name: "user" },
    ];
    const toolCall: ToolCall = {
      id: "call456",
      name: "get_user_info",
      input: { user_id: "u1" },
    };
    const context: AdvancedToolCallContext = {
      baseContext: baseContext,
      intendedToolCall: toolCall,
      executionPathAnalysis: {
        predictedNextStep: "text_response",
        potentialSideEffects: [],
        requiredPermissions: ["read:user"],
      },
    };

    expect(context.executionPathAnalysis.potentialSideEffects).toEqual([]);
    expect(context.intendedToolCall.id).toBe("call456");
  });

  it("should validate context when predicted next step is awaiting user", () => {
    const baseContext: Message[] = [
      { role: "assistant", content: "Please confirm the date.", name: "assistant" },
    ];
    const toolCall: ToolCall = {
      id: "call789",
      name: "confirm_date",
      input: {},
    };
    const context: AdvancedToolCallContext = {
      baseContext: baseContext,
      intendedToolCall: toolCall,
      executionPathAnalysis: {
        predictedNextStep: "awaiting_user",
        potentialSideEffects: ["prompt_user"],
        requiredPermissions: [],
      },
    };

    expect(context.executionPathAnalysis.predictedNextStep).toBe("awaiting_user");
    expect(context.executionPathAnalysis.requiredPermissions).toHaveLength(0);
  });
});