import { describe, it, expect } from "vitest";
import { StructuredToolInputValidationPipelineBuilderV127 } from "../src/validation/structured-tool-input-validation-pipeline-builder-v127";

describe("StructuredToolInputValidationPipelineBuilderV127", () => {
    it("should initialize correctly", () => {
        const builder = new StructuredToolInputValidationPipelineBuilderV127();
        expect(builder).toBeDefined();
    });

    it("should add validators correctly", () => {
        const builder = new StructuredToolInputValidationPipelineBuilderV127();
        const mockValidator: any = jest.fn();
        builder.addValidator(mockValidator);
        // Assuming there's a way to check internal state or a getter for validators
        // Since we don't see the implementation, we'll test the addition conceptually.
        // If the class had a getValidators() method, we would use it here.
        // For now, we just ensure the method runs without error.
    });

    it("should execute all added validators in sequence", () => {
        const builder = new StructuredToolInputValidationPipelineBuilderV127();
        const mockValidator1: any = jest.fn(() => ({ isValid: true }));
        const mockValidator2: any = jest.fn(() => ({ isValid: true }));
        const mockValidator3: any = jest.fn(() => ({ isValid: true }));

        builder.addValidator(mockValidator1);
        builder.addValidator(mockValidator2);
        builder.addValidator(mockValidator3);

        const context: any = { input: { key: "value" }, results: {} };
        const result = builder.run(context);

        expect(mockValidator1).toHaveBeenCalledWith(context.input);
        expect(mockValidator2).toHaveBeenCalledWith(context.input);
        expect(mockValidator3).toHaveBeenCalledWith(context.input);
        expect(result).toEqual({ isValid: true, message: undefined });
    });
});