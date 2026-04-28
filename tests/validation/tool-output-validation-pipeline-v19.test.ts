import { describe, it, expect } from "vitest";
import { ToolOutputValidatorPipeline } from "../src/validation/tool-output-validation-pipeline-v19";
import { ToolResultMessage, Message } from "../src/validation/types";

describe("ToolOutputValidatorPipeline", () => {
  it("should return valid when tool output is correct and history is sufficient", () => {
    const pipeline = new ToolOutputValidatorPipeline();
    const mockToolOutput: ToolResultMessage = {
      toolName: "mockTool",
      toolOutput: "Success data",
    };
    const mockHistory: Message[] = [
      {
        role: "user",
        content: [
          { type: "text", content: "What is the result?" },
        ],
      },
      {
        role: "assistant",
        content: [
          { type: "tool_use", content: { toolUse: { toolName: "mockTool" } } },
        ],
      },
    ];
    const mockContext: Record<string, any> = {
      sessionId: "test-session",
    };

    const result = pipeline.validate(mockToolOutput, mockHistory, mockContext);
    expect(result.isValid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it("should report an error if toolName in output does not match the last tool use", () => {
    const pipeline = new ToolOutputValidatorPipeline();
    const mockToolOutput: ToolResultMessage = {
      toolName: "wrongTool",
      toolOutput: "Some data",
    };
    const mockHistory: Message[] = [
      {
        role: "user",
        content: [
          { type: "text", content: "Test" },
        ],
      },
      {
        role: "assistant",
        content: [
          { type: "tool_use", content: { toolUse: { toolName: "correctTool" } } },
        ],
      },
    ];
    const mockContext: Record<string, any> = {};

    const result = pipeline.validate(mockToolOutput, mockHistory, mockContext);
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain("Tool name mismatch: Expected 'correctTool' but got 'wrongTool'");
  });

  it("should report an error if toolOutput is missing", () => {
    const pipeline = new ToolOutputValidatorPipeline();
    const mockToolOutput: ToolResultMessage = {
      toolName: "mockTool",
      toolOutput: "", // Empty string, but we expect it to be present/non-empty based on typical validation
    };
    const mockHistory: Message[] = [
      {
        role: "user",
        content: [
          { type: "text", content: "Test" },
        ],
      },
      {
        role: "assistant",
        content: [
          { type: "tool_use", content: { toolUse: { toolName: "mockTool" } } },
        ],
      },
    ];
    const mockContext: Record<string, any> = {};

    // Adjusting the mock to simulate a missing or invalid output structure if necessary,
    // but testing the explicit check for toolOutput presence/validity.
    const invalidOutput: Partial<ToolResultMessage> = {
      toolName: "mockTool",
      toolOutput: undefined as any, // Simulating missing output
    };

    // Since the class expects ToolResultMessage, we'll test the explicit check for null/undefined if the validator handles it.
    // Assuming the validator checks for non-empty toolOutput.
    const result = pipeline.validate(mockToolOutput as unknown as ToolResultMessage, mockHistory, mockContext);
    // Depending on the exact implementation, this might fail on type casting or fail validation.
    // We test for the expected error message related to output content.
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain("Tool output cannot be empty.");
  });
});