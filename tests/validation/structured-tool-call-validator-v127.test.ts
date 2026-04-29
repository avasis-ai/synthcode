import { describe, it, expect } from "vitest";
import { StructuredToolCallValidatorV127 } from "../src/validation/structured-tool-call-validator-v127";

describe("StructuredToolCallValidatorV127", () => {
    const validator = new StructuredToolCallValidatorV127();
    const context = { /* Mock context if needed */ };

    it("should return false for null or non-object input", () => {
        const result = validator.validate(context, null);
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain("Tool call data must be a non-null object.");
    });

    it("should return false for primitive types", () => {
        const result = validator.validate(context, "string");
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain("Tool call data must be a non-null object.");
    });

    it("should validate a correctly structured tool call object", () => {
        const validData = {
            tool_call_id: "call_abc123",
            name: "get_current_weather",
            args: {
                location: "San Francisco",
                unit: "celsius"
            }
        };
        const result = validator.validate(context, validData);
        expect(result.isValid).toBe(true);
        expect(result.errors).toEqual([]);
    });
});