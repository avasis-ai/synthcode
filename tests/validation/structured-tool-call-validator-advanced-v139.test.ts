import { describe, it, expect } from "vitest";
import { StructuredToolCallValidatorAdvancedV139 } from "../src/validation/structured-tool-call-validator-advanced-v139";
import { Message, ToolUseBlock, ContentBlock } from "../src/validation/types";

describe("StructuredToolCallValidatorAdvancedV139", () => {
  it("should return valid when provided with correct structure and context", () => {
    const validator = new StructuredToolCallValidatorAdvancedV139<any>();
    const mockContext: any = {
      messageHistory: [
        { role: "user", content: "Call tool A and tool B" }
      ],
      toolCallDependencies: new Map(),
      runtimeState: {}
    };
    const validData = { toolCalls: [{ name: "toolA", arguments: {} }] };
    const result = validator.validate(validData, mockContext);
    expect(result.isValid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it("should return invalid with errors for missing required fields", () => {
    const validator = new StructuredToolCallValidatorAdvancedV139<any>();
    const mockContext: any = {
      messageHistory: [],
      toolCallDependencies: new Map(),
      runtimeState: {}
    };
    const invalidData = { toolCalls: [] }; // Missing structure or required content
    const result = validator.validate(invalidData, mockContext);
    expect(result.isValid).toBe(false);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]).toContain("toolCalls must contain at least one tool call");
  });

  it("should handle context dependencies correctly", () => {
    const validator = new StructuredToolCallValidatorAdvancedV139<any>();
    const mockContext: any = {
      messageHistory: [
        { role: "user", content: "Use tool X which depends on state Y" }
      ],
      toolCallDependencies: new Map([["toolX", ["stateY"]]]),
      runtimeState: { stateY: "someValue" }
    };
    const validData = { toolCalls: [{ name: "toolX", arguments: { dependency: "value" } }] };
    const result = validator.validate(validData, mockContext);
    expect(result.isValid).toBe(true);
  });
});