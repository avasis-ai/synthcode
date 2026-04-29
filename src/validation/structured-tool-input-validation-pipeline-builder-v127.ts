import { Message, UserMessage, AssistantMessage, ToolResultMessage, ContentBlock, TextBlock, ToolUseBlock, ThinkingBlock } from "./types";

type ValidatorResult = { isValid: boolean; message?: string };
type Validator = (input: Record<string, unknown>) => ValidatorResult;

interface PipelineContext {
    input: Record<string, unknown>;
    results: Record<string, any>;
}

abstract class BaseBuilder<T> {
    protected validators: Validator[] = [];

    protected addValidator(validator: Validator): this {
        this.validators.push(validator);
        return this;
    }

    public abstract build(): T;
}

class StructuredToolInputValidationPipelineBuilderV127 extends BaseBuilder<any> {
    private readonly requiredFields: Set<string> = new Set();

    addRequiredField(field: string): this {
        this.requiredFields.add(field);
        return this;
    }

    addValidator(validator: Validator): this {
        super.addValidator(validator);
        return this;
    }

    addCrossFieldCheck(check: (context: PipelineContext) => ValidatorResult): this {
        this.addValidator(async (input: Record<string, unknown>): Promise<ValidatorResult> => {
            const context: PipelineContext = { input, results: {} };
            return check(context);
        });
        return this;
    }

    private validateRequired(input: Record<string, unknown>): ValidatorResult {
        for (const field of this.requiredFields) {
            if (!(field in input) || typeof input[field] === 'undefined' || input[field] === null) {
                return { isValid: false, message: `Missing required field: ${field}` };
            }
        }
        return { isValid: true };
    }

    public build(): any {
        const pipeline: {
            validate: (input: Record<string, unknown>) => Promise<ValidatorResult>;
        } = {
            validate: async (input: Record<string, unknown>): Promise<ValidatorResult> => {
                let context: PipelineContext = { input, results: {} };

                // 1. Run required field checks first
                const requiredCheck = this.validateRequired(input);
                if (!requiredCheck.isValid) {
                    return { isValid: false, message: requiredCheck.message };
                }

                // 2. Run all registered validators sequentially
                for (const validator of this.validators) {
                    try {
                        const result = await validator(input);
                        if (!result.isValid) {
                            return { isValid: false, message: result.message || "Validation failed at an unknown step." };
                        }
                        // In a real scenario, we might update context.results here
                    } catch (e) {
                        return { isValid: false, message: `Validation step failed unexpectedly: ${(e as Error).message}` };
                    }
                }

                return { isValid: true };
            }
        };
        return pipeline;
    }
}

export { StructuredToolInputValidationPipelineBuilderV127 };