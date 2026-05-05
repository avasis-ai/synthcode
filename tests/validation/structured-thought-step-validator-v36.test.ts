import { describe, it, expect } from "vitest";
import { validateStructuredThoughtStep } from "../src/validation/structured-thought-step-validator-v36";
import { Message } from "../src/validation/types";

describe("validateStructuredThoughtStep", () => {
  it("should return true for a valid user step", () => {
    const userMessage: Message = {
      role: "user",
      content: {
        blocks: [
          { type: "text", content: "Hello world" },
        ],
      },
    };
    const steps: Message[] = [userMessage];
    expect(validateStructuredThoughtStep(userMessage, steps, 0)).toBe(true);
  });

  it("should return true for a valid assistant step with tool use", () => {
    const assistantMessage: Message = {
      role: "assistant",
      content: {
        blocks: [
          { type: "tool_use", content: { tool_use: { tool_name: "search", tool_input: "vitest" } } },
          { type: "text", content: "Search results are available." },
        ],
      },
    };
    const steps: Message[] = [
      { role: "user", content: { blocks: [{ type: "text", content: "What is vitest?" }] } },
      assistantMessage,
    ];
    expect(validateStructuredThoughtStep(assistantMessage, steps, 1)).toBe(true);
  });

  it("should return false for an assistant step that is missing required tool use block", () => {
    const invalidAssistantMessage: Message = {
      role: "assistant",
      content: {
        blocks: [
          { type: "text", content: "This assistant response is invalid." },
        ],
      },
    };
    const steps: Message[] = [
      { role: "user", content: { blocks: [{ type: "text", content: "Initial query" }] } },
      invalidAssistantMessage,
    ];
    expect(validateStructuredThoughtStep(invalidAssistantMessage, steps, 1)).toBe(false);
  });
});