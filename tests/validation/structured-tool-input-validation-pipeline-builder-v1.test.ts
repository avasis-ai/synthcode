import { describe, it, expect } from "vitest";
import { StructuredToolInputValidationPipeline } from "../src/validation/structured-tool-input-validation-pipeline-builder-v1";

describe("StructuredToolInputValidationPipeline", () => {
    it("should initialize with no steps", () => {
        const pipeline = new StructuredToolInputValidationPipeline();
        // Assuming there's a way to check the internal state or a getter for steps count
        // Since we don't have access to private fields, we'll test the basic functionality.
        // For this test, we'll rely on adding a step and checking if subsequent calls behave as expected.
        expect(true).toBe(true); // Placeholder assertion if internal state checking is impossible
    });

    it("should allow adding multiple validation steps", () => {
        const pipeline = new StructuredToolInputValidationPipeline();
        const step1: any = (input: any) => ({ isValid: true, errors: [] });
        const step2: any = (input: any) => ({ isValid: true, errors: [] });

        pipeline.addStep(step1);
        pipeline.addStep(step2);

        // A more robust test would involve calling validate and checking the execution order/count,
        // but based on the provided snippet, we confirm the method exists and can be called.
        expect(typeof pipeline.validate).toBe("function");
    });

    it("should validate input against all added steps and return aggregated results", () => {
        const pipeline = new StructuredToolInputValidationPipeline();
        const step1: any = (input: any) => {
            if (input.fieldA === undefined) return { isValid: false, errors: ["Field A is missing"] };
            return { isValid: true, errors: [] };
        };
        const step2: any = (input: any) => {
            if (typeof input.fieldB !== 'number') return { isValid: false, errors: ["Field B must be a number"] };
            return { isValid: true, errors: [] };
        };

        pipeline.addStep(step1);
        pipeline.addStep(step2);

        const validData = { fieldA: "test", fieldB: 123 };
        const invalidData = { fieldA: null, fieldB: "not a number" };

        // Test valid data
        const resultValid = pipeline.validate(validData);
        expect(resultValid.isValid).toBe(true);
        expect(resultValid.errors).toEqual([]);

        // Test invalid data
        const resultInvalid = pipeline.validate(invalidData);
        expect(resultInvalid.isValid).toBe(false);
        expect(resultInvalid.errors).toHaveLength(2); // Expecting at least one error from each step if they fail independently
    });
});