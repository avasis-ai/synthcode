import { describe, it, expect } from "vitest";
import { DependencyValidator } from "../src/validation/structured-tool-call-validator-v131-advanced";

describe("DependencyValidator", () => {
  it("should return valid when tool calls are correctly referenced in messages", () => {
    const context: { messages: any[]; toolCalls: any[] } = {
      messages: [
        { role: "user", content: "Call tool A and then tool B" },
        { role: "assistant", content: "Tool call A", toolUse: [{ toolCall: { id: "call-a" } }] },
        { role: "user", content: "Follow up on tool A", toolUse: [{ toolCall: { id: "call-a" } }] },
      ],
      toolCalls: [
        { id: "call-a", name: "toolA", arguments: {} },
        { id: "call-b", name: "toolB", arguments: {} },
      ],
    };
    const validator = new DependencyValidator();
    const result = validator.validate(context);
    expect(result.isValid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it("should report an error when a tool call in messages does not exist in toolCalls", () => {
    const context: { messages: any[]; toolCalls: any[] } = {
      messages: [
        { role: "user", content: "Call tool X", toolUse: [{ toolCall: { id: "call-x-missing" } }] },
      ],
      toolCalls: [
        { id: "call-a", name: "toolA", arguments: {} },
      ],
    };
    const validator = new DependencyValidator();
    const result = validator.validate(context);
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain("Tool call with ID 'call-x-missing' in messages was not found in the provided toolCalls.");
  });

  it("should report an error when toolUse block is present but empty", () => {
    const context: { messages: any[]; toolCalls: any[] } = {
      messages: [
        { role: "user", content: "No tool calls here", toolUse: [] },
      ],
      toolCalls: [
        { id: "call-a", name: "toolA", arguments: {} },
      ],
    };
    const validator = new DependencyValidator();
    const result = validator.validate(context);
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain("ToolUseBlock cannot be empty.");
  });
});