import { describe, it, expect } from "vitest";
import { DefaultStatefulOutputValidator } from "../src/validation/stateful-tool-output-validator";
import { Message, ToolResultMessage } from "../src/validation/types";

describe("DefaultStatefulOutputValidator", () => {
  const validator = new DefaultStatefulOutputValidator();

  it("should return valid when tool output is empty and context history is empty", () => {
    const toolOutput: ToolResultMessage = {
      toolName: "testTool",
      output: "",
      error: null,
    };
    const context: { history: Message[] } = { history: [] };
    const result = validator.validate(toolOutput, context);
    expect(result.isValid).toBe(true);
    expect(result.message).toBe("");
  });

  it("should return invalid if tool output contains an error", () => {
    const toolOutput: ToolResultMessage = {
      toolName: "testTool",
      output: "",
      error: "Tool execution failed",
    };
    const context: { history: Message[] } = { history: [{ role: "user", content: "Test" }] };
    const result = validator.validate(toolOutput, context);
    expect(result.isValid).toBe(false);
    expect(result.message).toContain("error");
  });

  it("should return valid if tool output is present and no error is reported", () => {
    const toolOutput: ToolResultMessage = {
      toolName: "testTool",
      output: "Success data",
      error: null,
    };
    const context: { history: Message[] } = { history: [{ role: "user", content: "Test" }] };
    const result = validator.validate(toolOutput, context);
    expect(result.isValid).toBe(true);
    expect(result.message).toBe("");
  });
});