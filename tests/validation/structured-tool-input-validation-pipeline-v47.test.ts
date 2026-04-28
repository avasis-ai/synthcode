import { describe, it, expect } from "vitest";
import { structuredToolInputValidationPipelineV47 } from "../src/validation/structured-tool-input-validation-pipeline-v47";

describe("structuredToolInputValidationPipelineV47", () => {
    it("should return valid result for correctly structured input", () => {
        const mockContext: ValidationContext = {
            inputData: { toolName: "getWeather", parameters: { location: "London" } },
            history: [
                { role: "user", content: [{ type: "text", text: "What's the weather like in London?" }] }
            ],
            context: {}
        };
        const result = structuredToolInputValidationPipelineV47(mockContext);
        expect(result.isValid).toBe(true);
        expect(result.errors).toEqual([]);
    });

    it("should detect missing required parameters in input data", () => {
        const mockContext: ValidationContext = {
            inputData: { toolName: "getWeather", parameters: { location: undefined } },
            history: [],
            context: {}
        };
        const result = structuredToolInputValidationPipelineV47(mockContext);
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain("Missing required parameter: location for tool getWeather.");
    });

    it("should handle empty or null input data gracefully", () => {
        const mockContext: ValidationContext = {
            inputData: null as any,
            history: [],
            context: {}
        };
        const result = structuredToolInputValidationPipelineV47(mockContext);
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain("Input data is null or undefined.");
    });
});