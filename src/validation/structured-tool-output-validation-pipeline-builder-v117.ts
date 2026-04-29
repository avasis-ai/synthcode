import { Message, ContentBlock, TextBlock, ToolUseBlock, ThinkingBlock } from "./types";

type ValidationResult = {
    isValid: boolean;
    errors: string[];
    data?: any;
};

type ValidatorFunction = (data: Record<string, unknown>) => ValidationResult;

interface ValidationPipeline {
    validate: (data: Record<string, unknown>) => ValidationResult;
}

class StructuredToolOutputValidationPipelineBuilder {
    private schema: Record<string, any>;
    private validators: ValidatorFunction[] = [];

    constructor(schema: Record<string, any>) {
        this.schema = schema;
    }

    addTypeValidator(validator: (data: Record<string, unknown>) => ValidationResult): this {
        this.validators.push(validator);
        return this;
    }

    addCrossFieldValidator(validator: (data: Record<string, unknown>) => ValidationResult): this {
        this.validators.push(validator);
        return this;
    }

    addTemporalValidator(validator: (data: Record<string, unknown>) => ValidationResult): this {
        this.validators.push(validator);
        return this;
    }

    build(): ValidationPipeline {
        const validate = (data: Record<string, unknown>): ValidationResult => {
            let currentData: Record<string, unknown> = { ...data };
            const errors: string[] = [];

            for (const validator of this.validators) {
                const result = validator(currentData);
                if (!result.isValid) {
                    errors.push(...result.errors);
                }
            }

            const finalResult: ValidationResult = {
                isValid: errors.length === 0,
                errors: errors,
                data: currentData
            };

            return finalResult;
        };

        return {
            validate
        };
    }
}

export { StructuredToolOutputValidationPipelineBuilder };