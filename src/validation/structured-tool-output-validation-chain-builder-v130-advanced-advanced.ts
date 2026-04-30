import { Message, UserMessage, AssistantMessage, ToolResultMessage, ContentBlock, TextBlock, ToolUseBlock, ThinkingBlock } from "./types";

type ValidationResult = {
    isValid: boolean;
    data: any;
    errors: string[];
};

type ValidatorFunction = (context: { history: Message[]; previousResult: any }) => Promise<ValidationResult>;

interface ChainBuilder {
    addSequentialStep(validator: ValidatorFunction): this;
    addParallelStep(validators: ValidatorFunction[]): this;
    addConditionalStep(condition: (context: { history: Message[]; previousResult: any }) => boolean, validator: ValidatorFunction): this;
    build(): {
        execute: (context: { history: Message[]; previousResult: any }) => Promise<ValidationResult>;
    };
}

class StructuredToolOutputValidationChainBuilder implements ChainBuilder {
    private sequentialValidators: ValidatorFunction[] = [];
    private parallelValidators: ValidatorFunction[][] = [];
    private conditionalValidators: { condition: (context: { history: Message[]; previousResult: any }) => boolean; validator: ValidatorFunction }[] = [];

    addSequentialStep(validator: ValidatorFunction): this {
        this.sequentialValidators.push(validator);
        return this;
    }

    addParallelStep(validators: ValidatorFunction[]): this {
        this.parallelValidators.push(validators);
        return this;
    }

    addConditionalStep(condition: (context: { history: Message[]; previousResult: any }) => boolean, validator: ValidatorFunction): this {
        this.conditionalValidators.push({ condition, validator });
        return this;
    }

    private async executeSequential(context: { history: Message[]; previousResult: any }): Promise<ValidationResult> {
        let currentResult: any = context.previousResult;
        let errors: string[] = [];

        for (const validator of this.sequentialValidators) {
            try {
                const result = await validator({ history: context.history, previousResult: currentResult });
                if (!result.isValid) {
                    errors.push(...result.errors);
                }
                currentResult = result.data;
            } catch (e) {
                errors.push(`Sequential step failed: ${(e as Error).message}`);
                currentResult = null;
            }
        }

        return { isValid: errors.length === 0, data: currentResult, errors };
    }

    private async executeParallel(context: { history: Message[]; previousResult: any }): Promise<ValidationResult> {
        let allErrors: string[] = [];
        let combinedData: any = {};

        for (const validators of this.parallelValidators) {
            const results = await Promise.all(
                validators.map(async (validator) => {
                    try {
                        return await validator({ history: context.history, previousResult: context.previousResult });
                    } catch (e) {
                        return { isValid: false, data: null, errors: [`Parallel step failed: ${(e as Error).message}`] };
                    }
                })
            );

            let stepErrors: string[] = [];
            let stepData: any = {};
            let stepIsValid = true;

            for (const result of results) {
                if (!result.isValid) {
                    stepErrors.push(...result.errors);
                    stepIsValid = false;
                }
                // Simple aggregation: assume the last successful result or combine fields if structure is known
                Object.assign(stepData, result.data || {});
            }

            if (stepErrors.length > 0) {
                allErrors.push(...stepErrors);
                stepIsValid = false;
            }
            combinedData[`parallel_step_${this.parallelValidators.indexOf(validators)}`] = stepData;
        }

        return { isValid: allErrors.length === 0, data: combinedData, errors: allErrors };
    }

    private async executeConditional(context: { history: Message[]; previousResult: any }): Promise<ValidationResult> {
        let finalResult: any = context.previousResult;
        let allErrors: string[] = [];

        for (const { condition, validator } of this.conditionalValidators) {
            if (condition(context)) {
                try {
                    const result = await validator({ history: context.history, previousResult: finalResult });
                    if (!result.isValid) {
                        allErrors.push(...result.errors);
                    }
                    finalResult = result.data;
                } catch (e) {
                    allErrors.push(`Conditional step failed: ${(e as Error).message}`);
                    finalResult = null;
                }
            }
        }

        return { isValid: allErrors.length === 0, data: finalResult, errors: allErrors };
    }

    build(): {
        execute: (context: { history: Message[]; previousResult: any }) => Promise<ValidationResult>;
    } {
        return {
            execute: async (context: { history: Message[]; previousResult: any }): Promise<ValidationResult> => {
                let currentContext: { history: Message[]; previousResult: any } = {
                    history: context.history,
                    previousResult: context.previousResult
                };

                // 1. Sequential Execution
                let result: ValidationResult = await this.executeSequential(currentContext);
                currentContext.previousResult = result.data;
                if (!result.isValid) {
                    return { isValid: false, data: null, errors: result.errors };
                }

                // 2. Parallel Execution
                result = await this.executeParallel(currentContext);
                currentContext.previousResult = result.data;
                if (!result.isValid) {
                    return { isValid: false, data: null, errors: result.errors };
                }

                // 3. Conditional Execution
                result = await this.executeConditional(currentContext);
                // Final result data is the output of the last executed step
                return { isValid: result.isValid, data: result.data, errors: result.errors };
            }
        };
    }
}

export const buildValidationChain = (): ChainBuilder => {
    return new StructuredToolOutputValidationChainBuilder();
};