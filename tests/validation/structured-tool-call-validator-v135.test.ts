import { describe, it, expect } from "vitest";
import { StructuredToolCallValidatorV135 } from "../src/validation/structured-tool-call-validator-v135";
import { ValidationContext } from "../src/validation/validator";

describe("StructuredToolCallValidatorV135", () => {
    it("should return valid when no tool call is present in the context", () => {
        const validator = new StructuredToolCallValidatorV135();
        const context: ValidationContext = {
            getToolCall: () => null,
        } as unknown as ValidationContext;
        const result = validator.validate(context);
        expect(result.isValid).toBe(true);
        expect(result.errors).toEqual([]);
    });

    it("should validate correctly when a tool call with all required fields is provided", () => {
        const validator = new StructuredToolCallValidatorV135();
        const mockToolCall = {
            name: "get_weather",
            args: { location: "Tokyo", unit: "celsius" },
        };
        const context: ValidationContext = {
            getToolCall: () => mockToolCall,
        } as unknown as ValidationContext;
        const result = validator.validate(context);
        expect(result.isValid).toBe(true);
        expect(result.errors).toEqual([]);
    });

    it("should report errors for missing required fields in the tool call", () => {
        const validator = new StructuredToolCallValidatorV135();
        const mockToolCall = {
            name: "", // Missing name check (though the implementation might handle this differently, testing the structure)
            args: undefined, // Missing args check
        };
        const context: ValidationContext = {
            getToolCall: () => mockToolCall,
        } as unknown as ValidationContext;
        const result = validator.validate(context);
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain("Tool call name is required.");
        expect(result.errors).toContain("Tool call arguments are required.");
    });
});