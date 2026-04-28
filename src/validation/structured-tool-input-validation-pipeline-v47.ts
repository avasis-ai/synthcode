import { Message, UserMessage, AssistantMessage, ToolResultMessage, ContentBlock, TextBlock, ToolUseBlock, ThinkingBlock } from "./types";

type ValidationResult = {
    isValid: boolean;
    errors: string[];
    context: Record<string, unknown>;
};

interface ValidationContext {
    inputData: Record<string, unknown>;
    history: Message[];
    context: Record<string, unknown>;
}

interface ValidationStep {
    execute(context: ValidationContext): ValidationResult;
}

interface TemporalConstraintStep extends ValidationStep {
    validateTemporal(context: ValidationContext): ValidationResult;
}

interface CrossFieldDependencyStep extends ValidationStep {
    validateDependencies(context: ValidationContext): ValidationResult;
}

export class StructuredToolInputValidationPipeline {
    private steps: ValidationStep[];

    private constructor(steps: ValidationStep[]) {
        this.steps = steps;
    }

    public static create(steps: ValidationStep[]): StructuredToolInputValidationPipeline {
        return new StructuredToolInputValidationPipeline(steps);
    }

    public validate(initialContext: ValidationContext): ValidationResult {
        let currentContext: ValidationContext = {
            inputData: initialContext.inputData,
            history: initialContext.history,
            context: { ...initialContext.context }
        };

        let aggregatedResult: ValidationResult = {
            isValid: true,
            errors: [],
            context: { ...initialContext.context }
        };

        for (const step of this.steps) {
            const result = step.execute(currentContext);
            aggregatedResult.isValid = aggregatedResult.isValid && result.isValid;
            aggregatedResult.errors.push(...result.errors);
            currentContext.context = { ...currentContext.context, ...result.context };
        }

        return {
            isValid: aggregatedResult.isValid,
            errors: aggregatedResult.errors,
            context: currentContext.context
        };
    }

    public static buildFromSchema(schema: Record<string, any>, requiredSteps: ValidationStep[]): StructuredToolInputValidationPipeline {
        const initialSteps: ValidationStep[] = [];

        // Placeholder for schema-based initial validation (e.g., type checking)
        const schemaValidator: ValidationStep = {
            execute: (context) => {
                const errors: string[] = [];
                let isValid = true;
                for (const key in schema) {
                    if (Object.prototype.hasOwnProperty.call(schema, key)) {
                        const expectedType = schema[key].type;
                        const actualValue = context.inputData[key];
                        if (actualValue === undefined) {
                            if (schema[key].required) {
                                errors.push(`Missing required field: ${key}`);
                                isValid = false;
                            }
                        } else if (typeof actualValue !== expectedType) {
                            errors.push(`Field ${key} expected type ${expectedType}, got ${typeof actualValue}`);
                            isValid = false;
                        }
                    }
                }
                return { isValid, errors, context: {} };
            }
        };

        initialSteps.push(schemaValidator);
        initialSteps.push(...requiredSteps);

        return StructuredToolInputValidationPipeline.create(initialSteps);
    }
}

export { StructuredToolInputValidationPipeline };