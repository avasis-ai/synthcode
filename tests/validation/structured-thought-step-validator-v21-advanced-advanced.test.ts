import { describe, it, expect } from "vitest";
import { StructuredThoughtStepValidatorV21AdvancedAdvanced } from "../src/validation/structured-thought-step-validator-v21-advanced-advanced";
import { Message, ContentBlock, TextBlock, ToolUseBlock, ThinkingBlock } from "../src/types";

describe("StructuredThoughtStepValidatorV21AdvancedAdvanced", () => {
    const validator = new StructuredThoughtStepValidatorV21AdvancedAdvanced();

    it("should return valid when history has less than 2 messages", () => {
        const history: Message[] = [];
        const result = validator.validate(history);
        expect(result.isValid).toBe(true);
        expect(result.errors).toEqual([]);
    });

    it("should return valid when history has exactly 2 messages and they are simple", () => {
        const history: Message[] = [
            { role: "user", content: [{ type: "text", text: "Hello" }] },
            { role: "assistant", content: [{ type: "text", text: "Hi there" }] }
        ];
        const result = validator.validate(history);
        expect(result.isValid).toBe(true);
        expect(result.errors).toEqual([]);
    });

    it("should detect an invalid transition when a thinking block is immediately followed by a user message", () => {
        const history: Message[] = [
            { role: "user", content: [{ type: "text", text: "Initial prompt" }] },
            { role: "assistant", content: [{ type: "thinking", content: "Thinking process..." }] },
            { role: "user", content: [{ type: "text", text: "Another user input" }] }
        ];
        const result = validator.validate(history);
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain("Invalid transition: A user message cannot immediately follow a thinking block.");
    });
});