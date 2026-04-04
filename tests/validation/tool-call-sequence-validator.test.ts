import { describe, it, expect } from "vitest";
import { ToolCallSequenceValidator } from "../src/validation/tool-call-sequence-validator";
import { Message } from "../src/validation/types";

describe("ToolCallSequenceValidator", () => {
  it("should return valid when no rules are provided and no violations exist", () => {
    const validator = new ToolCallSequenceValidator([]);
    const plan: Message[] = [
      { role: "user", content: "Hello" },
      { role: "tool_call", toolName: "toolA", toolCallIndex: 0 },
      { role: "tool_call", toolName: "toolB", toolCallIndex: 1 },
    ];
    const result = validator.validate(plan);
    expect(result.isValid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it("should detect a violation when a tool must run after another", () => {
    const rules: {
      ruleType: "must_run_after" | "must_run_before";
      sourceToolName: string;
      targetToolName: string;
    }[] = [
      { ruleType: "must_run_after", sourceToolName: "toolA", targetToolName: "toolB" },
    ];
    const validator = new ToolCallSequenceValidator(rules);
    const plan: Message[] = [
      { role: "tool_call", toolName: "toolB", toolCallIndex: 0 },
      { role: "tool_call", toolName: "toolA", toolCallIndex: 1 },
    ];
    const result = validator.validate(plan);
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain("toolB must run after toolA");
  });

  it("should detect a violation when a tool must run before another", () => {
    const rules: {
      ruleType: "must_run_after" | "must_run_before";
      sourceToolName: string;
      targetToolName: string;
    }[] = [
      { ruleType: "must_run_before", sourceToolName: "toolA", targetToolName: "toolB" },
    ];
    const validator = new ToolCallSequenceValidator(rules);
    const plan: Message[] = [
      { role: "tool_call", toolName: "toolB", toolCallIndex: 0 },
      { role: "tool_call", toolName: "toolA", toolCallIndex: 1 },
    ];
    const result = validator.validate(plan);
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain("toolB must run before toolA");
  });
});