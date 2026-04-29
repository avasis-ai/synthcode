import { Message, ContentBlock, TextBlock, ToolUseBlock, ThinkingBlock } from "./types";

type ValidationStep = (
    input: { message: Message; toolCalls: ToolUseBlock[] }
) => {
    isValid: boolean;
    errors: string[];
    context: Record<string, unknown>;
};

type PreValidationStep = (
    input: { message: Message; toolCalls: ToolUseBlock[] }
) => {
    isValid: boolean;
    errors: string[];
    context: Record<string, unknown>;
};

type ConditionalStep = {
    condition: (context: Record<string, unknown>) => boolean;
    step: ValidationStep;
};

export class StructuredToolCallValidationChainBuilderAdvanced {
    private validationSteps: ValidationStep[] = [];
    private preValidationSteps: PreValidationStep[] = [];
    private conditionalSteps: ConditionalStep[] = [];
    private chainLogic: "AND" | "OR" | "SEQUENCE" = "AND";

    constructor() {}

    public addValidationStep(step: ValidationStep): this {
        this.validationSteps.push(step);
        return this;
    }

    public addPreValidationStep(step: PreValidationStep): this {
        this.preValidationSteps.push(step);
        return this;
    }

    public addConditionalStep(condition: (context: Record<string, unknown>) => boolean, step: ValidationStep): this {
        this.conditionalSteps.push({ condition, step });
        return this;
    }

    public setChainLogic(logic: "AND" | "OR" | "SEQUENCE"): this {
        this.chainLogic = logic;
        return this;
    }

    private async executePreValidation(input: { message: Message; toolCalls: ToolUseBlock[] }): Promise<{ isValid: boolean; errors: string[]; context: Record<string, unknown> }> {
        let aggregateContext: Record<string, unknown> = {};
        let allErrors: string[] = [];
        let overallValid = true;

        for (const step of this.preValidationSteps) {
            const result = step(input);
            allErrors.push(...result.errors);
            overallValid = overallValid && result.isValid;
            Object.assign(aggregateContext, result.context);
        }

        return {
            isValid: overallValid,
            errors: allErrors,
            context: aggregateContext
        };
    }

    private async executeValidationSteps(input: { message: Message; toolCalls: ToolUseBlock[] }, initialContext: Record<string, unknown>): Promise<{ isValid: boolean; errors: string[]; context: Record<string, unknown> }> {
        let aggregateContext: Record<string, unknown> = { ...initialContext };
        let allErrors: string[] = [];
        let overallValid = true;

        for (const step of this.validationSteps) {
            const result = step({ message: input.message, toolCalls: input.toolCalls });
            allErrors.push(...result.errors);
            overallValid = overallValid && result.isValid;
            Object.assign(aggregateContext, result.context);
        }

        return {
            isValid: overallValid,
            errors: allErrors,
            context: aggregateContext
        };
    }

    private async executeConditionalSteps(input: { message: Message; toolCalls: ToolUseBlock[] }, context: Record<string, unknown>): Promise<{ isValid: boolean; errors: string[]; context: Record<string, unknown> }> {
        let aggregateContext: Record<string, unknown> = { ...context };
        let allErrors: string[] = [];
        let overallValid = true;

        for (const cStep of this.conditionalSteps) {
            if (cStep.condition(context)) {
                const result = cStep.step({ message: input.message, toolCalls: input.toolCalls });
                allErrors.push(...result.errors);
                overallValid = overallValid && result.isValid;
                Object.assign(aggregateContext, result.context);
            }
        }

        return {
            isValid: overallValid,
            errors: allErrors,
            context: aggregateContext
        };
    }

    public build(): {
        execute: (input: { message: Message; toolCalls: ToolUseBlock[] }) => Promise<{ isValid: boolean; errors: string[]; context: Record<string, unknown> }>;
    } {
        const executor = async (input: { message: Message; toolCalls: ToolUseBlock[] }): Promise<{ isValid: boolean; errors: string[]; context: Record<string, unknown> }> => {
            // 1. Pre-Validation
            const preValidationResult = await this.executePreValidation(input);
            if (!preValidationResult.isValid) {
                return { isValid: false, errors: [`Pre-validation failed: ${preValidationResult.errors.join('; ')}`], context: preValidationResult.context };
            }

            let currentContext = preValidationResult.context;

            // 2. Core Validation (Handles AND/OR/SEQUENCE logic conceptually by sequential execution, but the final aggregation respects the defined logic)
            let coreValidationResult = await this.executeValidationSteps(input, currentContext);
            currentContext = coreValidationResult.context;

            // 3. Conditional Validation
            let conditionalValidationResult = await this.executeConditionalSteps(input, currentContext);
            currentContext = conditionalValidationResult.context;

            // Final aggregation based on chain logic (Simplified: If any stage fails, the overall result is false, unless OR logic dictates otherwise)
            let finalValid = true;
            let finalErrors: string[] = [];

            if (this.chainLogic === "AND") {
                finalValid = coreValidationResult.isValid && conditionalValidationResult.isValid;
                finalErrors = [...preValidationResult.errors, ...coreValidationResult.errors, ...conditionalValidationResult.errors];
            } else if (this.chainLogic === "OR") {
                // In a real OR chain, we would stop on the first success. Here, we aggregate all results for reporting.
                finalValid = coreValidationResult.isValid || conditionalValidationResult.isValid;
                finalErrors = [...preValidationResult.errors, ...coreValidationResult.errors, ...conditionalValidationResult.errors];
            } else { // SEQUENCE (Default/Fallback)
                finalValid = coreValidationResult.isValid && conditionalValidationResult.isValid;
                finalErrors = [...preValidationResult.errors, ...coreValidationResult.errors, ...conditionalValidationResult.errors];
            }

            return {
                isValid: finalValid,
                errors: finalErrors,
                context: currentContext
            };
        };

        return { execute: executor };
    }
}