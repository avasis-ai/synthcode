import { Message, UserMessage, AssistantMessage, ToolResultMessage, ContentBlock, TextBlock, ToolUseBlock, ThinkingBlock } from "./types";

export type ValidationResult = {
    isValid: boolean;
    errors: string[];
    context: Record<string, unknown>;
};

export type ValidationStep = (context: Record<string, unknown>, input: Record<string, unknown>) => Promise<ValidationResult>;

export class ToolInputValidationPipeline {
    private steps: ValidationStep[];

    constructor(steps: ValidationStep[]) {
        this.steps = steps;
    }

    private async executeStep(step: ValidationStep, context: Record<string, unknown>, input: Record<string, unknown>): Promise<ValidationResult> {
        try {
            return await step(context, input);
        } catch (error) {
            return {
                isValid: false,
                errors: [`Execution failed: ${(error as Error).message}`],
                context: context,
            };
        }
    }

    public async validate(initialContext: Record<string, unknown>, input: Record<string, unknown>): Promise<ValidationResult> {
        let currentContext: Record<string, unknown> = { ...initialContext };
        let accumulatedErrors: string[] = [];
        let overallValid: boolean = true;

        for (const step of this.steps) {
            const result = await this.executeStep(step, currentContext, input);

            if (!result.isValid) {
                accumulatedErrors.push(...result.errors);
                overallValid = false;
                // Short-circuiting on failure is the default behavior unless a step explicitly handles continuation
                // For simplicity in this version, we stop on the first failure.
                break;
            }

            // Update context with successful step results
            currentContext = { ...currentContext, ...result.context };
        }

        return {
            isValid: overallValid,
            errors: accumulatedErrors,
            context: currentContext,
        };
    }

    public async validateParallel(initialContext: Record<string, unknown>, input: Record<string, unknown>, parallelSteps: ValidationStep[]): Promise<ValidationResult> {
        const resultsPromises = parallelSteps.map(step => this.executeStep(step, initialContext, input));
        const results = await Promise.all(resultsPromises);

        let overallValid: boolean = true;
        let accumulatedErrors: string[] = [];
        let finalContext: Record<string, unknown> = { ...initialContext };

        for (const result of results) {
            if (!result.isValid) {
                accumulatedErrors.push(...result.errors);
                overallValid = false;
            } else {
                // Merge context from all successful parallel steps
                finalContext = { ...finalContext, ...result.context };
            }
        }

        return {
            isValid: overallValid,
            errors: accumulatedErrors,
            context: finalContext,
        };
    }
}