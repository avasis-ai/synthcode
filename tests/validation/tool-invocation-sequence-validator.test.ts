import { describe, it, expect } from "vitest";
import { ToolInvocationSequenceValidatorImpl } from "../src/validation/tool-invocation-sequence-validator";
import { Message, ToolUseBlock } from "../src/validation/types";

describe("ToolInvocationSequenceValidatorImpl", () => {
  const validator = new ToolInvocationSequenceValidatorImpl();

  it("should return valid when tool calls are in correct sequence and context is sufficient", () => {
    const toolCalls: ToolUseBlock[] = [
      { toolId: "toolA", toolCallId: "call1" },
      { toolId: "toolB", toolCallId: "call2" },
    ];
    const context: Message[] = [
      { role: "user", content: "First action" },
      { role: "model", content: "Tool A used", toolUse: [{ toolId: "toolA", toolCallId: "call1" }] },
      { role: "tool", content: "Result A", toolUse: [{ toolId: "toolA", toolCallId: "call1" }] },
      { role: "model", content: "Tool B used", toolUse: [{ toolId: "toolB", toolCallId: "call2" }] },
    ];

    const result = validator.validate(toolCalls, context);
    expect(result.isValid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it("should return invalid when a tool call is attempted before its corresponding tool use message in context", () => {
    const toolCalls: ToolUseBlock[] = [
      { toolId: "toolB", toolCallId: "call2" },
      { toolId: "toolA", toolCallId: "call1" },
    ];
    const context: Message[] = [
      { role: "user", content: "First action" },
      { role: "model", content: "Tool B used", toolUse: [{ toolId: "toolB", toolCallId: "call2" }] },
    ];

    const result = validator.validate(toolCalls, context);
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain("Tool call 'toolB' with ID 'call2' was encountered, but the context does not show a preceding tool use for it.");
    expect(result.errors).toContain("Tool call 'toolA' with ID 'call1' was encountered, but the context does not show a preceding tool use for it.");
  });

  it("should return invalid when tool calls are out of order relative to context", () => {
    const toolCalls: ToolUseBlock[] = [
      { toolId: "toolA", toolCallId: "call1" },
      { toolId: "toolB", toolCallId: "call2" },
    ];
    const context: Message[] = [
      { role: "user", content: "Initial prompt" },
      { role: "model", content: "Tool B used", toolUse: [{ toolId: "toolB", toolCallId: "call2" }] },
      { role: "tool", content: "Result B", toolUse: [{ toolId: "toolB", toolCallId: "call2" }] },
      { role: "model", content: "Tool A used", toolUse: [{ toolId: "toolA", toolCallId: "call1" }] },
    ];

    const result = validator.validate(toolCalls, context);
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain("Tool call 'toolA' with ID 'call1' was encountered, but the context does not show a preceding tool use for it.");
  });
});