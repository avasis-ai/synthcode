import { Message, UserMessage, AssistantMessage, ToolResultMessage, ContentBlock, TextBlock, ToolUseBlock, ThinkingBlock } from "./types";

export type ValidationResult = {
    isValid: boolean;
    errors: string[];
    context: Record<string, any>;
};

export interface ValidationContext {
    inputData: Record<string, unknown>;
    history: Message[];
    state: Record<string, any>;
}

export interface ValidationStep {
    validate(context: ValidationContext): ValidationResult;
}

export class StructuredToolInputValidationPipeline {
    private steps: ValidationStep[] = [];

    public addStep(step: ValidationStep): void {
        this.steps.push(step);
    }

    public addCrossFieldValidator(validator: (context: ValidationContext) => { isValid: boolean; errors: string[] }): void {
        this.addStep({
            validate: (context: ValidationContext): ValidationResult => {
                const validation = validator(context);
                return {
                    isValid: validation.isValid,
                    errors: [...(context as any).initialErrors || [], ...validation.errors],
                    context: { ...context.state, initialErrors: validation.errors }
                };
            }
        });
    }

    public addTemporalConstraintValidator(validator: (context: ValidationContext) => { isValid: boolean; errors: string[] }): void {
        this.addStep({
            validate: (context: ValidationContext): ValidationResult => {
                const validation = validator(context);
                return {
                    isValid: validation.isValid,
                    errors: [...(context as any).initialErrors || [], ...validation.errors],
                    context: { ...context.state, initialErrors: validation.errors }
                };
            }
        });
    }

    public validate(initialContext: ValidationContext): ValidationResult {
        let currentContext: ValidationContext = {
            inputData: initialContext.inputData,
            history: initialContext.history,
            state: { ...initialContext.state }
        };

        let accumulatedErrors: string[] = [];

        for (const step of this.steps) {
            const result = step.validate(currentContext);

            if (!result.isValid) {
                accumulatedErrors.push(...result.errors);
            }

            currentContext = {
                ...currentContext,
                state: { ...currentContext.state, ...result.context }
            };
        }

        return {
            isValid: accumulatedErrors.length === 0,
            errors: accumulatedErrors,
            context: currentContext.state
        };
    }
}