import { ValidationStep, ValidationResult } from "./validation-step-builder-v128.js";

export class StructuredToolOutputValidationPipelineBuilderAdvanced {
    private steps: ValidationStep[] = [];

    addStep(step: ValidationStep): this {
        this.steps.push(step);
        return this;
    }

    addConditionalStep(condition: (result: any) => boolean, step: ValidationStep): this {
        const conditionalStep: ValidationStep = {
            execute: async (context: { result: any }): Promise<ValidationResult> => {
                if (condition(context.result)) {
                    return step.execute(context);
                }
                return { success: true, result: context.result, error: null, pathTaken: "skipped" };
            },
            name: `Conditional(${step.name})`,
            description: `Executes ${step.name} only if condition is met.`
        };
        this.steps.push(conditionalStep);
        return this;
    }

    build(): ValidationStep[] {
        return [...this.steps];
    }
}