import { describe, it, expect } from "vitest";
import { validateStructuredToolCallContext } from "../src/validation/structured-tool-call-validation-context";

describe("validateStructuredToolCallContext", () => {
  it("should return true for a valid tool call context", async () => {
    const mockContext = {
      messages: [
        { role: "user", content: [{ type: "text", text: "What is the weather?" }] } as Message[],
      ],
      toolCallId: "call-123",
      toolResult: {
        toolCallId: "call-123",
        content: [{ type: "text", text: "Sunny and warm." }] as ContentBlock[],
      },
      currentState: { weather: "Sunny" },
    };
    const result = await validateStructuredToolCallContext(mockContext);
    expect(result).toBe(true);
  });

  it("should return false if toolCallId is missing in context", async () => {
    const mockContext = {
      messages: [
        { role: "user", content: [{ type: "text", text: "What is the weather?" }] } as Message[],
      ],
      toolCallId: undefined,
      toolResult: null,
      currentState: {},
    };
    const result = await validateStructuredToolCallContext(mockContext);
    expect(result).toBe(false);
  });

  it("should return false if toolResult is missing", async () => {
    const mockContext = {
      messages: [
        { role: "user", content: [{ type: "text", text: "What is the weather?" }] } as Message[],
      ],
      toolCallId: "call-123",
      toolResult: undefined,
      currentState: {},
    };
    const result = await validateStructuredToolCallContext(mockContext);
    expect(result).toBe(false);
  });
});