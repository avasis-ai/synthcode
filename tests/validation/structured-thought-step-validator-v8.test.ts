import { describe, it, expect } from "vitest";
import { StructuredThoughtStepValidatorV8 } from "../src/validation/structured-thought-step-validator-v8";
import { Message, ContentBlock, TextBlock, ToolUseBlock, ThinkingBlock } from "../src/types";

describe("StructuredThoughtStepValidatorV8", () => {
    const validator = new StructuredThoughtStepValidatorV8();

    it("should return false if the current step message is invalid", () => {
        const invalidMessage: Message = {
            type: "message",
            content: [{ type: "text", text: "Some text" }],
        } as any; // Simulate an invalid structure for testing
        const previousSteps: Message[] = [{ type: "message", content: [] }];

        const result = validator.validate(invalidMessage, previousSteps);
        expect(result.isValid).toBe(false);
        expect(result.error).toBe("Invalid message structure provided.");
    });

    it("should validate a basic successful thought step", () => {
        const currentStep: Message = {
            type: "message",
            content: [
                { type: "thinking", content: [{ type: "text", text: "Thinking step content." }] } as ThinkingBlock,
            ],
        };
        const previousSteps: Message[] = [{ type: "message", content: [] }];

        const result = validator.validate(currentStep, previousSteps);
        expect(result.isValid).toBe(true);
    });

    it("should fail validation if the previous steps are missing required context (e.g., no previous message)", () => {
        const currentStep: Message = {
            type: "message",
            content: [
                { type: "thinking", content: [{ type: "text", text: "Thinking step content." }] } as ThinkingBlock,
            ],
        };
        const previousSteps: Message[] = [];

        const result = validator.validate(currentStep, previousSteps);
        expect(result.isValid).toBe(false);
        expect(result.error).toContain("Previous steps must contain at least one message.");
    });
});