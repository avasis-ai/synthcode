import { Message, ContentBlock, TextBlock, ToolUseBlock, ThinkingBlock } from "./types";

export type ValidationResult = {
    isValid: boolean;
    errors: string[];
    context: Record<string, unknown>;
};

export interface TemporalContext {
    startTime?: Date;
    endTime?: Date;
    metadata: Record<string, unknown>;
}

export interface ValidatorStep {
    validate(
        input: Record<string, unknown>,
        context: TemporalContext
    ): {
        isValid: boolean;
        errors: string[];
        newContext: TemporalContext;
    };
}

export class StructuredToolInputValidationPipeline {
    private validators: ValidatorStep[];

    constructor(initialValidators: ValidatorStep[] = []) {
        this.validators = initialValidators;
    }

    addValidator(validator: ValidatorStep): this {
        this.validators.push(validator);
        return this;
    }

    public runValidation(
        input: Record<string, unknown>,
        initialContext: TemporalContext = { metadata: {} }
    ): ValidationResult {
        let currentContext: TemporalContext = { ...initialContext, metadata: { ...initialContext.metadata } };
        let accumulatedErrors: string[] = [];
        let isValid = true;

        for (const validator of this.validators) {
            const result = validator.validate(input, currentContext);
            if (!result.isValid) {
                isValid = false;
                accumulatedErrors = [...accumulatedErrors, ...result.errors];
            }
            currentContext = result.newContext;
        }

        return {
            isValid: isValid,
            errors: accumulatedErrors,
            context: currentContext
        };
    }
}

export class TemporalConsistencyValidator implements ValidatorStep {
    private readonly temporalRules: {
        fieldA: string;
        fieldB: string;
        check: (a: unknown, b: unknown) => boolean;
        errorMessage: string;
    }[];

    constructor(rules: {
        fieldA: string;
        fieldB: string;
        check: (a: unknown, b: unknown) => boolean;
        errorMessage: string;
    }[] = []) {
        this.temporalRules = rules;
    }

    public validate(
        input: Record<string, unknown>,
        context: TemporalContext
    ): {
        isValid: boolean;
        errors: string[];
        newContext: TemporalContext;
    } {
        let errors: string[] = [];
        let isValid = true;

        for (const rule of this.temporalRules) {
            const valA = input[rule.fieldA];
            const valB = input[rule.fieldB];

            if (valA !== undefined && valB !== undefined) {
                if (!rule.check(valA, valB)) {
                    errors.push(rule.errorMessage);
                    isValid = false;
                }
            }
        }

        return {
            isValid: isValid,
            errors: errors,
            newContext: { ...context, metadata: { ...context.metadata } }
        };
    }
}

export class RequiredFieldValidator implements ValidatorStep {
    private readonly requiredFields: string[];

    constructor(requiredFields: string[]) {
        this.requiredFields = requiredFields;
    }

    public validate(
        input: Record<string, unknown>,
        context: TemporalContext
    ): {
        isValid: boolean;
        errors: string[];
        newContext: TemporalContext;
    } {
        let errors: string[] = [];
        let isValid = true;

        for (const field of this.requiredFields) {
            if (input[field] === undefined || input[field] === null || (typeof input[field] === 'string' && input[field].trim() === '')) {
                errors.push(`Field '${field}' is required.`);
                isValid = false;
            }
        }

        return {
            isValid: isValid,
            errors: errors,
            newContext: { ...context, metadata: { ...context.metadata } }
        };
    }
}