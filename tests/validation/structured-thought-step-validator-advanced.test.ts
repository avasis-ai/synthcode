import { describe, it, expect } from "vitest";
import { JustificationValidator } from "../src/validation/structured-thought-step-validator-advanced";
import { Message, ContentBlock, TextBlock, ToolUseBlock, ThinkingBlock } from "../src/validation/types";

describe("JustificationValidator", () => {
  it("should return valid when current step is a simple continuation", () => {
    const validator = new JustificationValidator();
    const currentStep: ThoughtStep = {
      stepId: "step1",
      content: [
        { type: "text", content: "This is a valid continuation." }
      ],
      metadata: {}
    };
    const previousStep: ThoughtStep = {
      stepId: "step0",
      content: [
        { type: "text", content: "Previous thought." }
      ],
      metadata: {}
    };
    const context: { history: Message[] } = { history: [] };

    const result = validator.validate(currentStep, previousStep, context);
    expect(result.isValid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it("should return invalid if the current step is missing content", () => {
    const validator = new JustificationValidator();
    const currentStep: ThoughtStep = {
      stepId: "step1",
      content: [],
      metadata: {}
    };
    const previousStep: ThoughtStep = {
      stepId: "step0",
      content: [
        { type: "text", content: "Previous thought." }
      ],
      metadata: {}
    };
    const context: { history: Message[] } = { history: [] };

    const result = validator.validate(currentStep, previousStep, context);
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain("Current step must contain content.");
  });

  it("should return invalid if the previous step was a tool use and current step doesn't acknowledge it", () => {
    const validator = new JustificationValidator();
    const currentStep: ThoughtStep = {
      stepId: "step2",
      content: [
        { type: "text", content: "Some unrelated text." }
      ],
      metadata: {}
    };
    const previousStep: ThoughtStep = {
      stepId: "step1",
      content: [
        { type: "tool_use", content: "tool_call_data" }
      ],
      metadata: {}
    };
    const context: { history: Message[] } = { history: [] };

    const result = validator.validate(currentStep, previousStep, context);
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain("If the previous step was a tool use, the current step must acknowledge the tool use.");
  });
});