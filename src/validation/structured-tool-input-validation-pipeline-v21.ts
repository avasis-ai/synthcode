import { Message, UserMessage, AssistantMessage, ToolResultMessage, ContentBlock, TextBlock, ToolUseBlock, ThinkingBlock } from "./types";

export type ValidationResult = {
    isValid: boolean;
    errors: string[];
    validatedData: Record<string, unknown>;
};

export interface ValidationStep {
    validate(input: Record<string, unknown>, context: Record<string, unknown>): { isValid: boolean; errors: string[]; data: Record<string, unknown> };
}

export interface SchemaValidator {
    validate(input: Record<string, unknown>): { isValid: boolean; errors: string[]; data: Record<string, unknown> };
}

export interface CustomValidator {
    (input: Record<string, unknown>, context: Record<string, unknown>): { isValid: boolean; errors: string[]; data: Record<string, unknown> };
}

export class StructuredToolInputValidationPipelineV21 {
    private steps: ValidationStep[] = [];

    constructor() {}

    addStep(step: ValidationStep): StructuredToolInputValidationPipelineV21 {
        this.steps.push(step);
        return this;
    }

    /**
     * Processes the input object through all registered validation steps sequentially.
     * @param input The raw input object to validate.
     * @param context An optional context object for cross-field validation.
     * @returns The final validation result.
     */
    private processSteps(input: Record<string, unknown>, context: Record<string, unknown>): ValidationResult {
        let currentData: Record<string, unknown> = { ...input };
        let allErrors: string[] = [];

        for (const step of this.steps) {
            const result = step.validate(input, { ...context, ...currentData });
            if (!result.isValid) {
                allErrors.push(...result.errors);
            }
            currentData = { ...currentData, ...result.data };
        }

        return {
            isValid: allErrors.length === 0,
            errors: allErrors,
            validatedData: currentData,
        };
    }

    /**
     * Validates the input against a predefined schema, then applies custom validators.
     * @param input The raw input object.
     * @param schemaValidator A validator implementing basic schema checks.
     * @param customValidators An array of custom cross-field validation functions.
     * @param context Optional context data for advanced validation.
     * @returns The final validation result.
     */
    public validate(
        input: Record<string, unknown>,
        schemaValidator: SchemaValidator,
        customValidators: CustomValidator[],
        context: Record<string, unknown> = {}
    ): ValidationResult {
        let currentData: Record<string, unknown> = { ...input };
        let allErrors: string[] = [];

        // 1. Schema Validation
        const schemaResult = schemaValidator.validate(input);
        if (!schemaResult.isValid) {
            allErrors.push(...schemaResult.errors);
        }
        currentData = { ...currentData, ...schemaResult.data };

        // 2. Custom Step Validation (using the pipeline mechanism for composition)
        const customStepWrapper: ValidationStep = {
            validate: (input: Record<string, unknown>, context: Record<string, unknown>): { isValid: boolean; errors: string[]; data: Record<string, unknown> } => {
                let stepErrors: string[] = [];
                let finalData: Record<string, unknown> = { ...context };

                for (const validator of customValidators) {
                    const result = validator(input, context);
                    if (!result.isValid) {
                        stepErrors.push(...result.errors);
                    }
                    finalData = { ...finalData, ...result.data };
                }
                return {
                    isValid: stepErrors.length === 0,
                    errors: stepErrors,
                    data: finalData,
                };
            }
        };

        // Combine custom validators into the pipeline processing flow
        this.addStep(customStepWrapper);
        
        // Re-run processing to ensure all steps (including the schema step if we were to integrate it fully) are covered.
        // For simplicity and adherence to the requested signature, we'll run the pipeline over the combined results.
        
        // Resetting the pipeline state for a clean run focusing on the required inputs:
        this.steps = [];
        this.addStep(customStepWrapper); // Only the custom logic step is added here for the final run structure.

        let finalResult = this.processSteps(input, context);
        
        // Since we manually ran schema validation first, we merge the results conceptually:
        return {
            isValid: schemaResult.isValid && finalResult.isValid,
            errors: [...(schemaResult.errors || []), ...(finalResult.errors || [])],
            validatedData: { ...schemaResult.data, ...finalResult.validatedData }
        };
    }
}