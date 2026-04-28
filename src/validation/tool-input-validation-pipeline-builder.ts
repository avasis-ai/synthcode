import { Message } from "./message-types";

type ValidatorStep = (data: Record<string, unknown>) => { isValid: boolean; errors: string[] };

interface ValidationPipeline {
    validate(data: Record<string, unknown>): { isValid: boolean; errors: string[] };
}

class SimpleValidationPipeline implements ValidationPipeline {
    private validators: ValidatorStep[] = [];

    addValidator(validator: ValidatorStep): void {
        this.validators.push(validator);
    }

    validate(data: Record<string, unknown>): { isValid: boolean; errors: string[] } {
        const errors: string[] = [];
        let isValid = true;

        for (const validator of this.validators) {
            const result = validator(data);
            if (!result.isValid) {
                isValid = false;
                errors.push(...result.errors);
            }
        }

        return { isValid, errors };
    }
}

export class ToolInputValidationPipelineBuilder {
    private schemaName: string;
    private pipeline: SimpleValidationPipeline;

    constructor(schemaName: string) {
        this.schemaName = schemaName;
        this.pipeline = new SimpleValidationPipeline();
    }

    addRequiredField(fieldName: string): ToolInputValidationPipelineBuilder {
        const validator: ValidatorStep = (data) => {
            const value = data[fieldName];
            if (value === undefined || value === null || (typeof value === 'string' && value.trim() === '')) {
                return { isValid: false, errors: [`Field '${fieldName}' is required.`] };
            }
            return { isValid: true, errors: [] };
        };
        this.pipeline.addValidator(validator);
        return this;
    }

    addTypeCheck(fieldName: string, expectedType: 'string' | 'number' | 'boolean' | 'object'): ToolInputValidationPipelineBuilder {
        const validator: ValidatorStep = (data) => {
            const value = data[fieldName];
            if (value === undefined || value === null) {
                return { isValid: true, errors: [] }; // Required check handles null/undefined
            }

            const typeCheck: boolean = switch (expectedType) {
                case 'string':
                    typeof value === 'string';
                    break;
                case 'number':
                    typeof value === 'number';
                    break;
                case 'boolean':
                    typeof value === 'boolean';
                    break;
                case 'object':
                    typeof value === 'object' && !Array.isArray(value) && value !== null;
                    break;
                default:
                    false;
            };

            if (!typeCheck) {
                return { isValid: false, errors: [`Field '${fieldName}' must be of type ${expectedType}.`] };
            }
            return { isValid: true, errors: [] };
        };
        this.pipeline.addValidator(validator);
        return this;
    }

    addRegexMatch(fieldName: string, pattern: RegExp, errorMessage: string): ToolInputValidationPipelineBuilder {
        const validator: ValidatorStep = (data) => {
            const value = data[fieldName];
            if (typeof value !== 'string') {
                return { isValid: true, errors: [] };
            }
            if (pattern.test(value)) {
                return { isValid: true, errors: [] };
            }
            return { isValid: false, errors: [errorMessage] };
        };
        this.pipeline.addValidator(validator);
        return this;
    }

    addCrossFieldDependency(fieldA: string, fieldB: string, condition: (aValue: unknown, bValue: unknown) => boolean, errorMessage: string): ToolInputValidationPipelineBuilder {
        const validator: ValidatorStep = (data) => {
            const aValue = data[fieldA];
            const bValue = data[fieldB];

            if (condition(aValue, bValue)) {
                return { isValid: true, errors: [] };
            }
            return { isValid: false, errors: [errorMessage] };
        };
        this.pipeline.addValidator(validator);
        return this;
    }

    build(): ValidationPipeline {
        return this.pipeline;
    }
}