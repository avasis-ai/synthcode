import { describe, it, expect } from "vitest";
import { StructuredToolOutputValidator } from "../src/validation/structured-tool-output-validation-pipeline-v33";

describe("StructuredToolOutputValidator", () => {
  it("should return valid when output is structurally correct and temporally consistent", () => {
    const validator = new StructuredToolOutputValidator();
    const validOutput: ToolResultMessage = {
      toolName: "some-tool",
      toolOutput: JSON.stringify({ result: "success", timestamp: Date.now() }),
      // Assuming other required fields are present and valid for this test case
    } as ToolResultMessage;

    const result = validator.validate(validOutput);
    expect(result.isValid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it("should detect missing toolName when output is invalid", () => {
    const validator = new StructuredToolOutputValidator();
    const invalidOutput: ToolResultMessage = {
      toolName: "", // Missing or empty
      toolOutput: JSON.stringify({ result: "failure" }),
    } as ToolResultMessage;

    const result = validator.validate(invalidOutput);
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain("Tool name is required.");
  });

  it("should detect invalid JSON format in toolOutput", () => {
    const validator = new StructuredToolOutputValidator();
    const invalidOutput: ToolResultMessage = {
      toolName: "some-tool",
      toolOutput: "{ invalid json", // Malformed JSON
    } as ToolResultMessage;

    const result = validator.validate(invalidOutput);
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain("Tool output must be a valid JSON string.");
  });
});