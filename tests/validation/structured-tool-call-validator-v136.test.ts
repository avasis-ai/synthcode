import { describe, it, expect } from "vitest";
import { StructuredToolCallValidatorV136 } from "../src/validation/structured-tool-call-validator-v136";
import { ToolCallDependency } from "../src/validation/structured-tool-call-validator-v136.types";

describe("StructuredToolCallValidatorV136", () => {
  it("should return valid when no tool calls are present", () => {
    const validator = new StructuredToolCallValidatorV136([]);
    const messages = [{ role: "user", content: "Hello" }];
    const result = validator.validate(messages);
    expect(result.isValid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it("should return invalid when tool call dependencies are violated", () => {
    const dependencies: ToolCallDependency[] = [
      { requiredToolUseId: "tool_use_1", dependencyType: "output_required" },
    ];
    const validator = new StructuredToolCallValidatorV136(dependencies);
    const messages = [
      { role: "user", content: "Call tool 1" },
      { role: "model", content: "Tool use 1" },
    ];
    // Simulate a scenario where the required output is missing or incorrect
    // For this test, we assume the validator checks for the presence of the required output.
    const result = validator.validate(messages);
    expect(result.isValid).toBe(false);
    expect(result.errors).toContainEqual(expect.stringContaining("Missing required output for tool use 'tool_use_1'"));
  });

  it("should return valid when all tool call dependencies are met", () => {
    const dependencies: ToolCallDependency[] = [
      { requiredToolUseId: "tool_use_1", dependencyType: "output_required" },
      { requiredToolUseId: "tool_use_2", dependencyType: "sequence_required" },
    ];
    const validator = new StructuredToolCallValidatorV136(dependencies);
    const messages = [
      { role: "user", content: "Call tool 1 and tool 2" },
      { role: "model", content: "Tool use 1" },
      { role: "tool", content: "Output for tool 1", toolUseId: "tool_use_1" },
      { role: "model", content: "Tool use 2" },
      { role: "tool", content: "Output for tool 2", toolUseId: "tool_use_2" },
    ];
    const result = validator.validate(messages);
    expect(result.isValid).toBe(true);
    expect(result.errors).toEqual([]);
  });
});