import { describe, it, expect } from "vitest";
import { StructuredThoughtStepValidatorV6 } from "../src/validation/structured-thought-step-validator-v6";
import { Message, ContentBlock, ThinkingBlock } from "../src/types";

describe("StructuredThoughtStepValidatorV6", () => {
    const validator = new StructuredThoughtStepValidatorV6();
    const context = { /* Mock context if needed */ };

    it("should return valid if fewer than 2 steps are provided", () => {
        const steps: Message[] = [];
        const result = validator.validate(steps, context);
        expect(result.isValid).toBe(true);
        expect(result.errors).toEqual([]);
    });

    it("should validate correctly when steps are valid", () => {
        const steps: Message[] = [
            { content: { type: "text", text: "Step 1" } },
            { content: { type: "thinking", thinking: { id: "thought1", content: "Thinking content" } } }
        ];
        const result = validator.validate(steps, context);
        expect(result.isValid).toBe(true);
        expect(result.errors).toEqual([]);
    });

    it("should detect an invalid sequence when a thinking block is missing an ID", () => {
        const steps: Message[] = [
            { content: { type: "text", text: "Step 1" } },
            { content: { type: "thinking", thinking: { id: "", content: "Thinking content" } } } // Empty ID
        ];
        const result = validator.validate(steps, context);
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain("Thinking block at index 1 must have a non-empty ID.");
    });
});