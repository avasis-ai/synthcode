import { describe, it, expect } from "vitest";
import {
  ValidationStep,
  ExecutionContext,
  Message,
  UserMessage,
  AssistantMessage,
  ToolResultMessage,
} from "../src/validation/structured-tool-input-validation-pipeline-v31";

describe("StructuredToolInputValidationPipelineV31", () => {
  it("should return valid result for a simple valid input", async () => {
    const mockContext: ExecutionContext = {
      input: { toolName: "getWeather", location: "London" },
      history: [
        new UserMessage("What is the weather like in London?"),
        new AssistantMessage("I can help with that. Please specify the location."),
      ],
      state: {},
    };
    const result = await ValidationStep.execute(mockContext, mockContext.history);
    expect(result.isValid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it("should return invalid result with errors for missing required fields", async () => {
    const mockContext: ExecutionContext = {
      input: { toolName: "getWeather" }, // Missing location
      history: [
        new UserMessage("What is the weather?"),
      ],
      state: {},
    };
    const result = await ValidationStep.execute(mockContext, mockContext.history);
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain("Missing required parameter: location for tool 'getWeather'");
  });

  it("should handle empty context gracefully", async () => {
    const mockContext: ExecutionContext = {
      input: {},
      history: [],
      state: {},
    };
    const result = await ValidationStep.execute(mockContext, mockContext.history);
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain("Input context is empty, cannot validate tool usage.");
  });
});