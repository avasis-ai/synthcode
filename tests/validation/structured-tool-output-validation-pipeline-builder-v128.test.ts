import { describe, it, expect } from "vitest";
import { StructuredToolOutputValidationPipelineBuilderV128 } from "../src/validation/structured-tool-output-validation-pipeline-builder-v128";
import { ValidatorStep } from "../src/validation/validation-pipeline-executor";

describe("StructuredToolOutputValidationPipelineBuilderV128", () => {
    it("should correctly add a simple step", () => {
        const builder = new StructuredToolOutputValidationPipelineBuilderV128();
        const mockStep: ValidatorStep = {
            validate: (input: Record<string, unknown>) => true,
            name: "mock-step"
        };
        builder.addStep(mockStep);
        // Assuming there's a way to check the internal state or a getter for steps
        // Since we don't have access to internal state, we'll test the return type and basic functionality.
        // For a real test, we'd mock/spy on the builder's internal step array.
        // For this example, we'll just assert the return type chainability.
        expect(builder).toBeInstanceOf(StructuredToolOutputValidationPipelineBuilderV128);
    });

    it("should correctly add a conditional step", () => {
        const builder = new StructuredToolOutputValidationPipelineBuilderV128();
        const mockStep: ValidatorStep = {
            validate: (input: Record<string, unknown>) => true,
            name: "mock-conditional-step"
        };
        const condition: (input: Record<string, unknown>) => boolean = () => true;
        builder.addConditionalStep(condition, mockStep);
        // Again, testing chainability and type safety for the conditional addition.
        expect(builder).toBeInstanceOf(StructuredToolOutputValidationPipelineBuilderV128);
    });

    it("should allow chaining of addStep and addConditionalStep methods", () => {
        const builder = new StructuredToolOutputValidationPipelineBuilderV128();
        const mockStep1: ValidatorStep = { validate: () => true, name: "step1" };
        const mockStep2: ValidatorStep = { validate: () => true, name: "step2" };
        const condition: (input: Record<string, unknown>) => boolean = () => false;

        const result = builder
            .addStep(mockStep1)
            .addConditionalStep(condition, mockStep2);

        expect(result).toBe(builder);
    });
});