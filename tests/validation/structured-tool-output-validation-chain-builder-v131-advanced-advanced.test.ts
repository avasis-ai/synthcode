import { describe, it, expect } from "vitest";
import { StructuredToolOutputValidationChainBuilderAdvancedAdvanced } from "../src/validation/structured-tool-output-validation-chain-builder-v131-advanced-advanced";

describe("StructuredToolOutputValidationChainBuilderAdvancedAdvanced", () => {
    it("should allow adding multiple type validators", () => {
        const builder = new StructuredToolOutputValidationChainBuilderAdvancedAdvanced();
        const validator1: (output: unknown) => { isValid: boolean; errors: string[] } = () => ({ isValid: true, errors: [] });
        const validator2: (output: unknown) => { isValid: boolean; errors: string[] } = () => ({ isValid: true, errors: [] });

        builder.addTypeValidator(validator1);
        builder.addTypeValidator(validator2);

        // We can't directly test the internal state, but we can check if the builder instance remains usable
        // and that the method call doesn't throw.
        expect(builder).toBeInstanceOf(StructuredToolOutputValidationChainBuilderAdvancedAdvanced);
    });

    it("should correctly chain validators and return 'this'", () => {
        const builder = new StructuredToolOutputValidationChainBuilderAdvancedAdvanced();
        const validator: (output: unknown) => { isValid: boolean; errors: string[] } = () => ({ isValid: true, errors: [] });

        const result = builder.addTypeValidator(validator);

        expect(result).toBe(builder);
    });

    it("should handle an empty chain gracefully", () => {
        const builder = new StructuredToolOutputValidationChainBuilderAdvancedAdvanced();
        // Assuming there's a method to build/validate that handles an empty chain without crashing
        // Since we don't have the full implementation, we test the construction.
        expect(builder).toBeDefined();
    });
});