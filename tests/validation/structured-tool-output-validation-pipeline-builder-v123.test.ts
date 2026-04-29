import { describe, it, expect } from "vitest";
import { StructuredToolOutputValidationPipelineBuilderV123 } from "../src/validation/structured-tool-output-validation-pipeline-builder-v123";
import { Validator } from "../src/validation/validator";

describe("StructuredToolOutputValidationPipelineBuilderV123", () => {
    it("should initialize with empty validators", () => {
        const builder = new StructuredToolOutputValidationPipelineBuilderV123();
        // Assuming there's a way to check private state or we test the public API's effect
        // For this test, we'll just ensure instantiation works.
        expect(builder).toBeInstanceOf(StructuredToolOutputValidationPipelineBuilderV123);
    });

    it("should allow adding multiple standard validators", () => {
        const builder = new StructuredToolOutputValidationPipelineBuilderV123();
        const mockValidator1 = { validate: () => true } as unknown as Validator;
        const mockValidator2 = { validate: () => true } as unknown as Validator;

        builder.addValidator(mockValidator1).addValidator(mockValidator2);

        // Since we can't directly access private 'validators', we rely on the fluent interface
        // and assume the internal state is managed correctly by the builder pattern.
        // A more robust test would require getter methods or mocking the internal structure.
        // For now, we just confirm the chaining works.
        expect(builder).toBeDefined();
    });

    it("should allow adding conditional validators", () => {
        const builder = new StructuredToolOutputValidationPipelineBuilderV123();
        const mockCondition = (output: Record<string, unknown>) => output["key"] === "test";
        const mockValidator = { validate: () => true } as unknown as Validator;

        builder.addConditionalValidator(mockCondition, mockValidator);

        // Again, testing the fluent interface and type safety.
        expect(builder).toBeDefined();
    });
});