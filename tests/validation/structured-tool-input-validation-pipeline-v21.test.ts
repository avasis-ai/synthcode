import { describe, it, expect } from "vitest";
import { ValidationPipeline } from "../src/validation/structured-tool-input-validation-pipeline-v21";

describe("ValidationPipeline", () => {
    it("should return valid result for correctly structured input", async () => {
        const pipeline = new ValidationPipeline();
        const input = {
            toolName: "get_weather",
            parameters: {
                location: "New York",
                unit: "celsius"
            }
        };
        const result = await pipeline.validate(input, {});
        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
    });

    it("should return invalid result with errors for missing required fields", async () => {
        const pipeline = new ValidationPipeline();
        const input = {
            toolName: "get_weather",
            parameters: {}
        };
        const result = await pipeline.validate(input, {});
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain("Missing required parameter: location");
    });

    it("should handle empty input gracefully", async () => {
        const pipeline = new ValidationPipeline();
        const input = {};
        const result = await pipeline.validate(input, {});
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain("Missing required field: toolName");
    });
});