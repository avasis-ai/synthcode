import { describe, it, expect } from "vitest";
import {
    StructuredToolOutputValidator,
    UserMessage,
    AssistantMessage,
    ToolResultMessage,
} from "../src/validation/structured-tool-output-validator";

describe("StructuredToolOutputValidator", () => {
    it("should validate a simple user message structure", () => {
        const userMessage: UserMessage = { role: "user", content: "Hello world" };
        const validator = new StructuredToolOutputValidator();
        expect(validator.isValidMessage(userMessage)).toBe(true);
    });

    it("should validate a simple tool result message structure", () => {
        const toolResultMessage: ToolResultMessage = {
            role: "tool",
            tool_use_id: "call_abc123",
            content: "Tool executed successfully",
        };
        const validator = new StructuredToolOutputValidator();
        expect(validator.isValidMessage(toolResultMessage)).toBe(true);
    });

    it("should return false for an invalid message structure (e.g., missing role)", () => {
        const invalidMessage = { content: "Missing role" };
        const validator = new StructuredToolOutputValidator();
        expect(validator.isValidMessage(invalidMessage)).toBe(false);
    });
});