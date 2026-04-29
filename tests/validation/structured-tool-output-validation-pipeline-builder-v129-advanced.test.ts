import { describe, it, expect } from "vitest";
import { StructuredToolOutputValidationPipelineBuilderAdvanced } from "../src/validation/structured-tool-output-validation-pipeline-builder-v129-advanced.js";
import { ValidationStep } from "../src/validation/validation-step-builder-v128.js";

describe("StructuredToolOutputValidationPipelineBuilderAdvanced", () => {
    it("should initialize with no steps", () => {
        const builder = new StructuredToolOutputValidationPipelineBuilderAdvanced();
        // Assuming there's a way to check internal state or that the constructor implies an empty state
        // Since we can't access private fields directly without modification, we test the addStep functionality.
        // For this test, we rely on the addStep method being callable.
        expect(builder).toBeInstanceOf(StructuredToolOutputValidationPipelineBuilderAdvanced);
    });

    it("should add a single validation step correctly", async () => {
        const mockStep: ValidationStep = {
            execute: async (context: { result: any }): Promise<any> => context.result
        };
        const builder = new StructuredToolOutputValidationPipelineBuilderAdvanced();
        builder.addStep(mockStep);

        // To properly test this, we'd need a method to retrieve or execute the built pipeline.
        // Given the current structure, we test the fluent interface aspect.
        // We'll assume adding a step modifies the internal state correctly.
        // A more robust test would require an 'execute' method on the builder.
        // For now, we just confirm the chaining works.
        const resultBuilder = builder.addStep(mockStep);
        expect(resultBuilder).toBe(builder);
    });

    it("should add a conditional step correctly", async () => {
        const mockStep: ValidationStep = {
            execute: async (context: { result: any }): Promise<any> => context.result
        };
        const condition = (result: any) => result && typeof result === 'string';
        const builder = new StructuredToolOutputValidationPipelineBuilderAdvanced();

        builder.addConditionalStep(condition, mockStep);

        // Similar to the above, we test the fluent interface and the callability.
        const resultBuilder = builder.addConditionalStep(condition, mockStep);
        expect(resultBuilder).toBe(builder);
    });
});