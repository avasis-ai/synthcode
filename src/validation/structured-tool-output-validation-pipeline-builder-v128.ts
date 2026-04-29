import { ValidatorStep, ValidationPipelineExecutor } from "./validation-pipeline-executor";

export class StructuredToolOutputValidationPipelineBuilderV128 {
    private steps: ValidatorStep[] = [];

    public addStep(step: ValidatorStep): this {
        this.steps.push(step);
        return this;
    }

    public addConditionalStep(
        condition: (input: Record<string, unknown>) => boolean,
        step: ValidatorStep
    ): this {
        const conditionalStep: ValidatorStep = {
            execute: (input: Record<string, unknown>): unknown => {
                if (condition(input)) {
                    return step.execute(input);
                }
                return undefined;
            },
            name: `Conditional(${step.name})`
        };
        this.steps.push(conditionalStep);
        return this;
    }

    public addCrossFieldValidation(
        validator: (input: Record<string, unknown>) => { isValid: boolean; message: string }
    ): this {
        const crossFieldStep: ValidatorStep = {
            execute: (input: Record<string, unknown>): unknown => {
                const result = validator(input);
                if (!result.isValid) {
                    throw new Error(`Cross-field validation failed: ${result.message}`);
                }
                return undefined;
            },
            name: "CrossFieldValidation"
        };
        this.steps.push(crossFieldStep);
        return this;
    }

    public build(): ValidationPipelineExecutor {
        const executor: ValidationPipelineExecutor = {
            execute: async (input: Record<string, unknown>): Promise<unknown> => {
                let currentInput: Record<string, unknown> = { ...input };

                for (const step of this.steps) {
                    try {
                        const result = step.execute(currentInput);
                        // In a real scenario, we might update currentInput based on the step's output
                        // For simplicity here, we just pass through the original input context.
                        currentInput = { ...currentInput, lastStepOutput: result };
                    } catch (error) {
                        throw new Error(`Validation failed at step ${step.name}: ${(error as Error).message}`);
                    }
                }
                return undefined;
            },
            getPipelineName: () => "StructuredToolOutputValidationPipelineV128"
        };
        return executor;
    }
}