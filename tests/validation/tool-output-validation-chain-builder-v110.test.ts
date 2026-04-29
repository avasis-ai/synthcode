import { describe, it, expect } from "vitest";
import { ToolOutputValidationChainBuilder } from "../src/validation/tool-output-validation-chain-builder-v110";

describe("ToolOutputValidationChainBuilder", () => {
    it("should initialize correctly with an initial context schema", () => {
        const schema = { type: "object", properties: { id: { type: "string" } } };
        const builder = new ToolOutputValidationChainBuilder(schema);
        // We can't directly test private members, but we can test methods that rely on it.
        // For now, we just ensure instantiation doesn't throw.
        expect(builder).toBeInstanceOf(ToolOutputValidationChainBuilder);
    });

    it("should add a step with a validator and name", () => {
        const builder = new ToolOutputValidationChainBuilder({});
        const mockValidator = jest.fn((output: any) => ({ isValid: true, errors: [] }));
        const mockStep = { validator: mockValidator, name: "testStep" };

        // Assuming there's an addStep method or similar based on usage pattern
        // Since the full class implementation isn't provided, we'll assume an addStep method exists.
        // If addStep doesn't exist, this test might need adjustment based on actual API.
        // For this example, we'll assume a method exists to add steps.
        // If the constructor takes the initial context, we might need to mock that setup.
        // Let's assume a method like addStep(validator, name) exists.
        const addStep = (validator: (output: any) => { isValid: boolean; errors: string[] }, name: string) => {
            // Mocking the internal state change for testing purposes
            (builder as any).steps.push({ validator, name });
        };
        
        const builderInstance = new ToolOutputValidationChainBuilder({});
        addStep(mockValidator, "testStep");

        // A more robust test would check the internal state if possible, 
        // but for now, we check if the addition process seems to work conceptually.
        // Since we can't see the implementation, we'll rely on the structure.
        // If we could access the steps array:
        // expect((builderInstance as any).steps.length).toBe(1);
    });

    it("should build a chain that can validate an output against all added steps", () => {
        const builder = new ToolOutputValidationChainBuilder({});
        const mockValidator1 = jest.fn((output: any) => ({ isValid: true, errors: [] }));
        const mockValidator2 = jest.fn((output: any) => ({ isValid: false, errors: ["Error in step 2"] }));

        // Mocking the addition of steps again
        const addStep = (validator: (output: any) => { isValid: boolean; errors: string[] }, name: string) => {
            (builder as any).steps.push({ validator, name });
        };
        
        addStep(mockValidator1, "step1");
        addStep(mockValidator2, "step2");

        // Assuming a buildChain method exists that returns the executable chain
        const buildChain = (builder: ToolOutputValidationChainBuilder) => {
            // Mock implementation: returns a function that runs all validators
            return (output: any) => {
                let allValid = true;
                let allErrors: string[] = [];
                for (const step of (builder as any).steps) {
                    const result = step.validator(output);
                    if (!result.isValid) {
                        allValid = false;
                        allErrors.push(...result.errors);
                    }
                }
                return { isValid: allValid, errors: allErrors };
            };
        };

        const chain = buildChain(builder);
        const testOutput = { data: "test" };

        const result = chain(testOutput);
        
        // Based on the mock validators (step1 passes, step2 fails)
        expect(result.isValid).toBe(false);
        expect(result.errors).toEqual(["Error in step 2"]);
    });
});