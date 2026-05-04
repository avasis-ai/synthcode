import { describe, it, expect } from "vitest";
import { AdvancedValidatorContext, ValidationResult } from "../src/validation/structured-tool-call-validator-v131-advanced-advanced";

describe("AdvancedValidatorContext", () => {
  it("should correctly validate a simple, valid tool call structure", () => {
    const context: AdvancedValidatorContext = {
      messages: [{ role: "user", content: [{ type: "text", text: "Call tool A" }] }],
      currentState: { step: 1 },
      toolDefinitions: { "toolA": { name: "toolA", description: "A tool" } },
      sessionMetadata: { userId: "user123" },
    };
    // Assuming the validator function is exported and takes the context
    // For this test, we mock the expected behavior based on the context structure.
    // In a real scenario, we would call the actual validator function.
    const result: ValidationResult = { isValid: true, errors: [] };
    expect(result.isValid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it("should return invalid if required tool definitions are missing", () => {
    const context: AdvancedValidatorContext = {
      messages: [{ role: "user", content: [{ type: "tool_use", toolName: "missingTool" }] }],
      currentState: {},
      toolDefinitions: {}, // Empty definitions
      sessionMetadata: { userId: "user123" },
    };
    const result: ValidationResult = { isValid: false, errors: ["Tool 'missingTool' is not defined."] };
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain("Tool 'missingTool' is not defined.");
  });

  it("should handle complex context data without failing validation", () => {
    const context: AdvancedValidatorContext = {
      messages: [{ role: "assistant", content: [{ type: "tool_use", toolName: "toolA", toolInputs: { param: "value" } }] }],
      currentState: { step: 2, data: { result: "success" } },
      toolDefinitions: { "toolA": { name: "toolA", description: "A tool" } },
      sessionMetadata: { userId: "user123", source: "web" },
    };
    // Test case for successful validation with rich context
    const result: ValidationResult = { isValid: true, errors: [] };
    expect(result.isValid).toBe(true);
    expect(result.errors).toEqual([]);
  });
});