import { describe, it, expect } from "vitest";
import { StructuredToolCallValidatorV138 } from "../src/validation/structured-tool-call-validator-v138";

describe("StructuredToolCallValidatorV138", () => {
    it("should return invalid when messages are missing or empty", () => {
        const validator = new StructuredToolCallValidatorV138();
        expect(validator.validate(null)).toEqual({ isValid: false, errors: ["Input data must contain messages."] });
        expect(validator.validate({ messages: [] })).toEqual({ isValid: false, errors: ["Input data must contain messages."] });
    });

    it("should return valid when messages contain a single valid tool call message", () => {
        const validator = new StructuredToolCallValidatorV138();
        const validData = {
            messages: [{
                role: "user",
                content: "Call tool",
                tool_calls: [{
                    id: "call_abc",
                    type: "function",
                    function: {
                        name: "get_weather",
                        arguments: JSON.stringify({ location: "Tokyo" }),
                    },
                }],
            }],
        };
        expect(validator.validate(validData)).toEqual({ isValid: true, errors: [] });
    });

    it("should return invalid when tool_calls structure is incorrect", () => {
        const validator = new StructuredToolCallValidatorV138();
        const invalidData = {
            messages: [{
                role: "user",
                content: "Call tool",
                tool_calls: [{
                    id: "call_abc",
                    type: "invalid_type", // Invalid type
                    function: {
                        name: "get_weather",
                        arguments: JSON.stringify({ location: "Tokyo" }),
                    },
                }],
            }],
        };
        const result = validator.validate(invalidData);
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain("Tool call type must be 'function'.");
    });
});