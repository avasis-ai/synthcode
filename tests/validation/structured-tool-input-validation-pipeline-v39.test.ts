import { describe, it, expect } from "vitest";
import { ValidationPipeline, ValidationContext, ValidationStep } from "../src/validation/structured-tool-input-validation-pipeline-v39";

describe("ValidationPipeline", () => {
    it("should validate correctly with valid input", () => {
        const mockContext: ValidationContext = {
            inputData: { toolName: "search", query: "test" },
            history: [],
            state: {}
        };
        const pipeline = new ValidationPipeline([
            { name: "step1", validate: (context) => ({ isValid: true, errors: [], context: { step1: true } }) },
            { name: "step2", validate: (context) => ({ isValid: true, errors: [], context: { step2: true } }) }
        ]);
        const result = pipeline.run(mockContext);
        expect(result.isValid).toBe(true);
        expect(result.errors).toEqual([]);
        expect(result.context).toEqual({ step1: true, step2: true });
    });

    it("should accumulate errors when any step fails validation", () => {
        const mockContext: ValidationContext = {
            inputData: { toolName: "search", query: "test" },
            history: [],
            state: {}
        };
        const pipeline = new ValidationPipeline([
            { name: "step1", validate: (context) => ({ isValid: true, errors: [], context: { step1: true } }) },
            { name: "step2", validate: (context) => ({ isValid: false, errors: ["Missing required field"], context: { step2: false } }) },
            { name: "step3", validate: (context) => ({ isValid: false, errors: ["Invalid format"], context: { step3: false } }) }
        ]);
        const result = pipeline.run(mockContext);
        expect(result.isValid).toBe(false);
        expect(result.errors).toHaveLength(2);
        expect(result.errors).toEqual(expect.arrayContaining(["Missing required field", "Invalid format"]));
        expect(result.context).toEqual({ step1: true, step2: false, step3: false });
    });

    it("should return the context from the last successful step even if subsequent steps fail", () => {
        const mockContext: ValidationContext = {
            inputData: { toolName: "search", query: "test" },
            history: [],
            state: {}
        };
        const pipeline = new ValidationPipeline([
            { name: "step1", validate: (context) => ({ isValid: true, errors: [], context: { step1: true } }) },
            { name: "step2", validate: (context) => ({ isValid: true, errors: [], context: { step2: true } }) },
            { name: "step3", validate: (context) => ({ isValid: false, errors: ["Failure"], context: { step3: false } }) }
        ]);
        const result = pipeline.run(mockContext);
        expect(result.isValid).toBe(false);
        expect(result.context).toEqual({ step1: true, step2: true, step3: false });
    });
});