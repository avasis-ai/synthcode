import { describe, it, expect } from "vitest";
import { StructuredThoughtStepValidatorAdvanced } from "../src/validation/structured-thought-step-validator-v27-advanced";
import { Message, ContentBlock, ThinkingBlock } from "../src/validation/types";

describe("StructuredThoughtStepValidatorAdvanced", () => {
  it("should return valid when the current step is a simple thought block", () => {
    const validator = new StructuredThoughtStepValidatorAdvanced();
    const context: any = {
      allSteps: [
        { type: "message", content: { blocks: [{ type: "content", text: "Start" }] } },
        { type: "message", content: { blocks: [{ type: "thinking", text: "Thinking step" }] } },
        { type: "message", content: { blocks: [{ type: "content", text: "End" }] } },
      ],
      currentStepIndex: 1,
      currentStep: { type: "message", content: { blocks: [{ type: "thinking", text: "Thinking step" }] } },
      precedingSteps: [
        { type: "message", content: { blocks: [{ type: "content", text: "Start" }] } },
      ],
      succeedingSteps: [
        { type: "message", content: { blocks: [{ type: "content", text: "End" }] } },
      ],
    };
    const result = validator.validate(context);
    expect(result.isValid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it("should return invalid if the current step is missing required content blocks", () => {
    const validator = new StructuredThoughtStepValidatorAdvanced();
    const context: any = {
      allSteps: [
        { type: "message", content: { blocks: [{ type: "content", text: "Start" }] } },
        { type: "message", content: { blocks: [] } }, // Invalid step
        { type: "message", content: { blocks: [{ type: "content", text: "End" }] } },
      ],
      currentStepIndex: 1,
      currentStep: { type: "message", content: { blocks: [] } },
      precedingSteps: [
        { type: "message", content: { blocks: [{ type: "content", text: "Start" }] } },
      ],
      succeedingSteps: [
        { type: "message", content: { blocks: [{ type: "content", text: "End" }] } },
      ],
    };
    const result = validator.validate(context);
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain("Current step must contain at least one content block.");
  });

  it("should return invalid if the thought block is empty when it should contain reasoning", () => {
    const validator = new StructuredThoughtStepValidatorAdvanced();
    const context: any = {
      allSteps: [
        { type: "message", content: { blocks: [{ type: "content", text: "Start" }] } },
        { type: "message", content: { blocks: [{ type: "thinking", text: "" }] } }, // Empty thinking
        { type: "message", content: { blocks: [{ type: "content", text: "End" }] } },
      ],
      currentStepIndex: 1,
      currentStep: { type: "message", content: { blocks: [{ type: "thinking", text: "" }] } },
      precedingSteps: [
        { type: "message", content: { blocks: [{ type: "content", text: "Start" }] } },
      ],
      succeedingSteps: [
        { type: "message", content: { blocks: [{ type: "content", text: "End" }] } },
      ],
    };
    const result = validator.validate(context);
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain("Thinking block cannot be empty.");
  });
});