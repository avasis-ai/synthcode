import { describe, it, expect } from "vitest";
import { StructuredToolCallValidatorV129Advanced } from "../src/validation/structured-tool-call-validator-v129-advanced";
import { ToolUseBlock } from "../src/types";

describe("StructuredToolCallValidatorV129Advanced", () => {
    const context: Record<string, unknown> = {
        // Mock context for testing
        user: "test-user",
    };
    const validator = new StructuredToolCallValidatorV129Advanced(context);

    it("should return valid when toolCall structure is correct", () => {
        const validToolCall: ToolUseBlock = {
            tool_calls: [
                {
                    id: "call-id-123",
                    type: "function",
                    function: {
                        name: "get_current_weather",
                        arguments: JSON.stringify({ location: "San Francisco", unit: "celsius" }),
                    },
                },
            ],
        };
        const result = validator.validateToolCall(validToolCall);
        expect(result.isValid).toBe(true);
        expect(result.errors).toEqual([]);
    });

    it("should return invalid with errors if tool_calls array is missing", () => {
        const invalidToolCall: ToolUseBlock = {
            tool_calls: undefined as any, // Simulate missing property
        };
        const result = validator.validateToolCall(invalidToolCall);
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain("The 'tool_calls' field is required.");
    });

    it("should return invalid if a tool_call object is missing required fields", () => {
        const invalidToolCall: ToolUseBlock = {
            tool_calls: [
                {
                    id: "call-id-123",
                    type: "function",
                    // Missing 'function' field entirely
                }
            ],
        };
        const result = validator.validateToolCall(invalidToolCall);
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain("Each tool call must specify a 'function' object.");
    });
});