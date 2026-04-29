import { Message, ContentBlock, ToolUseBlock, TextBlock, ThinkingBlock } from "./types";

type ValidationStep = (
    output: Record<string, unknown>,
    context: Record<string, unknown>
) => { isValid: boolean; errors: string[]; result: Record<string, unknown> };

interface AdvancedValidationOptions {
    initialContext?: Record<string, unknown>;
    contextProviders?: {
        key: string;
        provider: (context: Record<string, unknown>) => Promise<Record<string, unknown>>;
    }[];
}

export class StructuredToolOutputValidationChainBuilderAdvanced {
    private steps: ValidationStep[] = [];
    private options: AdvancedValidationOptions;

    constructor(options: AdvancedValidationOptions = {}) {
        this.options = {
            initialContext: options.initialContext,
            contextProviders: options.contextProviders || [],
        };
    }

    private addStep(step: ValidationStep): this {
        this.steps.push(step);
        return this;
    }

    public addSchemaValidation(validator: (data: Record<string, unknown>) => { isValid: boolean; errors: string[]; result: Record<string, unknown> }): this {
        return this.addStep((output, context) => {
            const validationResult = validator(output);
            return {
                isValid: validationResult.isValid,
                errors: validationResult.errors,
                result: validationResult.result,
            };
        });
    }

    public addContextualDependencyCheck(checkFn: (output: Record<string, unknown>, context: Record<string, unknown>) => { isValid: boolean; errors: string[]; result: Record<string, unknown> }): this {
        return this.addStep(checkFn);
    }

    public addExternalApiValidation(apiValidator: (output: Record<string, unknown>, context: Record<string, unknown>) => Promise<{ isValid: boolean; errors: string[]; result: Record<string, unknown> }>): this {
        return this.addStep(async (output, context) => {
            try {
                const result = await apiValidator(output, context);
                return result;
            } catch (e) {
                return { isValid: false, errors: [`External API validation failed: ${e instanceof Error ? e.message : String(e)}`], result: output };
            }
        });
    }

    public build(): {
        execute: (output: Record<string, unknown>, initialContext: Record<string, unknown> = {}) => Promise<{ isValid: boolean; errors: string[]; finalResult: Record<string, unknown> }>;
        getSteps: () => ValidationStep[];
    } {
        return {
            getSteps: () => [...this.steps],
            execute: async (output: Record<string, unknown>, initialContext: Record<string, unknown> = {}): Promise<{ isValid: boolean; errors: string[]; finalResult: Record<string, unknown> }> => {
                let currentContext: Record<string, unknown> = { ...this.options.initialContext, ...initialContext };
                let currentOutput: Record<string, unknown> = { ...output };

                for (const step of this.steps) {
                    let stepResult: { isValid: boolean; errors: string[]; result: Record<string, unknown> };

                    if (step.name === 'external-api-validation') {
                        // This path is complex due to async nature, assuming the step wrapper handles it.
                        // For simplicity in this structure, we rely on the step function itself being async if needed.
                        stepResult = await step(currentOutput, currentContext);
                    } else {
                        stepResult = step(currentOutput, currentContext);
                    }

                    if (!stepResult.isValid) {
                        return {
                            isValid: false,
                            errors: [...(currentContext.validationErrors || []), ...stepResult.errors],
                            finalResult: currentOutput,
                        };
                    }

                    currentOutput = stepResult.result;
                    // In a real scenario, context updates would happen here based on step execution
                }

                return {
                    isValid: true,
                    errors: [],
                    finalResult: currentOutput,
                };
            }
        };
    }
}