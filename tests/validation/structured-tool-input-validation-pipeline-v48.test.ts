import { describe, it, expect } from "vitest";
import {
    StructuredToolInputValidationPipelineV48,
    TemporalContext,
    ValidationResult,
} from "../src/validation/structured-tool-input-validation-pipeline-v48";

describe("StructuredToolInputValidationPipelineV48", () => {
    it("should return valid result for correctly structured input", () => {
        const mockContext: TemporalContext = {
            metadata: {
                user: "testuser",
            },
        };
        const mockInput: Record<string, unknown> = {
            toolName: "search",
            parameters: {
                query: "test search query",
                maxResults: 10,
            },
        };

        const result: ValidationResult = StructuredToolInputValidationPipelineV48.validate(
            mockInput,
            mockContext
        );

        expect(result.isValid).toBe(true);
        expect(result.errors).toEqual([]);
    });

    it("should detect missing required parameters in the input", () => {
        const mockContext: TemporalContext = {
            metadata: {},
        };
        const mockInput: Record<string, unknown> = {
            toolName: "search",
            parameters: {
                // 'query' is missing
                maxResults: 5,
            },
        };

        const result: ValidationResult = StructuredToolInputValidationPipelineV48.validate(
            mockInput,
            mockContext
        );

        expect(result.isValid).toBe(false);
        expect(result.errors).toContain("Missing required parameter: query");
    });

    it("should handle invalid data types for parameters", () => {
        const mockContext: TemporalContext = {
            metadata: {},
        };
        const mockInput: Record<string, unknown> = {
            toolName: "calculator",
            parameters: {
                a: "not a number", // Should be a number
                b: 5,
            },
        };

        const result: ValidationResult = StructuredToolInputValidationPipelineV48.validate(
            mockInput,
            mockContext
        );

        expect(result.isValid).toBe(false);
        expect(result.errors).toContain("Invalid type for parameter 'a': Expected number, received string");
    });
});