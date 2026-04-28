import { describe, it, expect } from "vitest";
import { StructuredToolInputValidationPipeline } from "../src/validation/structured-tool-input-validation-pipeline-v43";

describe("StructuredToolInputValidationPipeline", () => {
  it("should return valid when all inputs are correct", () => {
    const pipeline = new StructuredToolInputValidationPipeline();
    const result = pipeline.validate({
      userMessage: { type: "UserMessage", content: [{ type: "TextBlock", text: "Hello" }] } as any,
      toolUse: { type: "ToolUseBlock", toolName: "testTool", toolInputs: { param1: "value1" } } as any,
      // Add other required fields if necessary for a full test
    });
    expect(result.isValid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it("should detect missing userMessage when required", () => {
    const pipeline = new StructuredToolInputValidationPipeline();
    const result = pipeline.validate({
      toolUse: { type: "ToolUseBlock", toolName: "testTool", toolInputs: {} } as any,
    });
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain("userMessage is required.");
  });

  it("should detect invalid toolInputs structure", () => {
    const pipeline = new StructuredToolInputValidationPipeline();
    const result = pipeline.validate({
      userMessage: { type: "UserMessage", content: [{ type: "TextBlock", text: "Test" }] } as any,
      toolUse: { type: "ToolUseBlock", toolName: "testTool", toolInputs: "not an object" } as any,
    });
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain("toolInputs must be an object.");
  });
});