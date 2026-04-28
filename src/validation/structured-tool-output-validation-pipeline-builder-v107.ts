import { Message, UserMessage, AssistantMessage, ToolResultMessage, ContentBlock, TextBlock, ToolUseBlock, ThinkingBlock } from "./types";

type ValidationResult = {
    isValid: boolean;
    errors: string[];
    output: unknown;
};

interface ValidationStep {
    execute: (input: unknown, state: Record<string, any>) => Promise<{ result: unknown; state: Record<string, any> }>;
}

class StructuredToolOutputValidationPipelineBuilder {
    private targetSchema: Record<string, any>;
    private steps: ValidationStep[] = [];

    constructor(targetSchema: Record<string, any>) {
        this.targetSchema = targetSchema;
    }

    addSchemaValidationStep(): this {
        const schemaValidator: ValidationStep = async (input, state) => {
            console.log("Executing Schema Validation Step...");
            // Mock schema validation logic
            if (typeof input !== 'object' || input === null) {
                return { result: null, state: { ...state, schemaValid: false } };
            }
            // In a real implementation, this would use a JSON Schema validator
            const isValid = Object.keys(input).every(key => typeof input[key] !== 'undefined');
            return { result: input, state: { ...state, schemaValid: isValid } };
        };
        this.steps.push(schemaValidator);
        return this;
    }

    addTypeCheckingStep(): this {
        const typeChecker: ValidationStep = async (input, state) => {
            console.log("Executing Type Checking Step...");
            // Mock type checking logic
            if (typeof input !== 'object' || input === null) {
                return { result: null, state: { ...state, typeChecked: false } };
            }
            // Simple check: ensure all top-level properties are strings or numbers for this example
            const allValidTypes = Object.values(input).every(val => typeof val === 'string' || typeof val === 'number');
            return { result: input, state: { ...state, typeChecked: allValidTypes } };
        };
        this.steps.push(typeChecker);
        return this;
    }

    addCustomValidatorStep(validator: (input: unknown, state: Record<string, any>) => Promise<{ isValid: boolean; message: string }>): this {
        const customStep: ValidationStep = async (input, state) => {
            console.log("Executing Custom Validation Step...");
            const validationResult = await validator(input, state);
            if (!validationResult.isValid) {
                return { result: null, state: { ...state, customValidationPassed: false, customError: validationResult.message } };
            }
            return { result: input, state: { ...state, customValidationPassed: true } };
        };
        this.steps.push(customStep);
        return this;
    }

    build(): {
        execute: (input: unknown, initialState: Record<string, any>): Promise<ValidationResult>;
    } {
        const pipelineExecutor = async (input: unknown, initialState: Record<string, any>): Promise<ValidationResult> => {
            let currentState: Record<string, any> = { ...initialState };
            let currentOutput: unknown = input;
            const errors: string[] = [];

            for (const step of this.steps) {
                try {
                    const { result: stepResult, state: newState } = await step.execute(currentOutput, currentState);
                    currentOutput = stepResult;
                    currentState = newState;
                } catch (e) {
                    errors.push(`Pipeline step failed: ${(e as Error).message}`);
                    currentOutput = null;
                    break;
                }
            }

            const isValid = errors.length === 0 && (currentState as any).schemaValid === true && (currentState as any).typeChecked === true;

            return {
                isValid: isValid,
                errors: errors,
                output: currentOutput,
            };
        };

        return {
            execute: pipelineExecutor,
        };
    }
}

export { StructuredToolOutputValidationPipelineBuilder };