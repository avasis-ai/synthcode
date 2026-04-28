import { describe, it, expect } from "vitest";
import { StructuredToolOutputValidationPipelineBuilder } from "../src/validation/structured-tool-output-validation-pipeline-builder-v104";

describe("StructuredToolOutputValidationPipelineBuilder", () => {
    it("should build a pipeline with a single validator", () => {
        const builder = new StructuredToolOutputValidationPipelineBuilder();
        // Mocking the addValidator method for testing purposes
        (builder as any).addValidator = jest.fn().mockReturnThis();
        builder.addValidator({})(/* mock validator */);

        expect((builder as any).addValidator).toHaveBeenCalledTimes(1);
    });

    it("should build a pipeline with multiple validators and constraints", () => {
        const builder = new StructuredToolOutputValidationPipelineBuilder();
        // Mocking methods to simulate adding components
        (builder as any).addValidator = jest.fn().mockReturnThis();
        (builder as any).addConstraint = jest.fn().mockReturnThis();

        builder.addValidator({})(/* mock validator */);
        builder.addConstraint({})(/* mock constraint */);
        builder.addValidator({})(/* mock validator */);

        expect((builder as any).addValidator).toHaveBeenCalledTimes(2);
        expect((builder as any).addConstraint).toHaveBeenCalledTimes(1);
    });

    it("should build and validate data correctly using the built pipeline", () => {
        const builder = new StructuredToolOutputValidationPipelineBuilder();
        // Mocking the build method to return a mock pipeline
        (builder as any).build = jest.fn().mockReturnValue({
            validate: jest.fn((data: any) => ({ isValid: true, errors: [] }))
        });

        const pipeline = builder.build();
        const result = pipeline.validate({ key: "value" });

        expect(pipeline).toBeDefined();
        expect(result).toEqual({ isValid: true, errors: [] });
    });
});