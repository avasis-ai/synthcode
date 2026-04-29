import { Message, ContentBlock, TextBlock, ToolUseBlock, ThinkingBlock } from "./types";

type ValidationResult = {
    isValid: boolean;
    errors: string[];
    context: Record<string, unknown>;
};

type Condition = (context: Record<string, unknown>) => boolean;

interface ValidationStep {
    execute: (input: Record<string, unknown>, context: Record<string, unknown>) => ValidationResult;
}

class ValidationChain {
    private steps: { step: ValidationStep; condition: Condition | (() => boolean) }[] = [];

    addStep(step: ValidationStep): void {
        this.steps.push({ step, condition: () => true });
    }

    addConditionalStep(condition: Condition, step: ValidationStep): void {
        this.steps.push({ step, condition });
    }

    build(): { execute: (initialInput: Record<string, unknown>, initialContext: Record<string, unknown>) => ValidationResult } {
        return {
            execute: (initialInput: Record<string, unknown>, initialContext: Record<string, unknown>): ValidationResult => {
                let currentContext = { ...initialContext, ...initialInput };
                let currentResult: ValidationResult = { isValid: true, errors: [], context: { ...initialContext, ...initialInput } };

                for (const { step, condition } of this.steps) {
                    const shouldExecute = typeof condition === 'function' ? condition(currentContext) : true;

                    if (shouldExecute) {
                        const stepResult = step.execute(currentContext, currentContext);
                        currentResult.isValid = currentResult.isValid && stepResult.isValid;
                        currentResult.errors = [...currentResult.errors, ...stepResult.errors];
                        currentResult.context = { ...currentResult.context, ...stepResult.context };
                    }
                }

                return currentResult;
            }
        };
    }
}

export class StructuredOutputValidationChainBuilderV123 {
    private builder: ValidationChain = new ValidationChain();

    addStep(step: ValidationStep): this {
        this.builder.addStep(step);
        return this;
    }

    addConditionalStep(condition: Condition, step: ValidationStep): this {
        this.builder.addConditionalStep(condition, step);
        return this;
    }

    build(): ValidationChain {
        return this.builder;
    }
}