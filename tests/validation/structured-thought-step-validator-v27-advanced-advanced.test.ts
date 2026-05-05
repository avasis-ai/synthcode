import { describe, it, expect } from "vitest";
import { StructuredThoughtStepValidatorV27AdvancedAdvanced } from "../src/validation/structured-thought-step-validator-v27-advanced-advanced";
import { Message } from "../src/validation/types";

describe("StructuredThoughtStepValidatorV27AdvancedAdvanced", () => {
    const validator = new StructuredThoughtStepValidatorV27AdvancedAdvanced();

    it("should return valid when provided with a sequence of messages", () => {
        const validSteps: Message[] = [
            { type: "user", content: { type: "text", text: "Hello" } } as Message,
            { type: "model", content: { type: "thinking", thinking: "Thinking step 1" } } as Message,
            { type: "user", content: { type: "text", text: "Response" } } as Message,
        ];
        const result = validator.validateSequence(validSteps);
        expect(result.isValid).toBe(true);
        expect(result.errors).toEqual([]);
    });

    it("should return invalid and list errors for an empty sequence", () => {
        const emptySteps: Message[] = [];
        const result = validator.validateSequence(emptySteps);
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain("The sequence of thought steps cannot be empty.");
    });

    it("should return invalid for a sequence with an incorrect structure (e.g., missing required block)", () => {
        const invalidSteps: Message[] = [
            { type: "user", content: { type: "text", text: "Start" } } as Message,
            // Simulate a missing thinking block where one is expected
            { type: "model", content: { type: "text", text: "Direct response without thought" } } as Message,
        ];
        const result = validator.validateSequence(invalidSteps);
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain("Model response must contain a thinking step before providing a final answer.");
    });
});