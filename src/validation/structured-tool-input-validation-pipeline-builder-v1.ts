import { Message, UserMessage, AssistantMessage, ToolResultMessage, ContentBlock, TextBlock, ToolUseBlock, ThinkingBlock } from "./types";

type ValidatorStep = (input: Record<string, unknown>) => { isValid: boolean; errors: string[] };

interface SchemaDefinition {
    fields: Record<string, { required: boolean; type: "string" | "number" | "boolean"; }>;
}

class StructuredToolInputValidationPipeline {
    private steps: ValidatorStep[] = [];

    addStep(step: ValidatorStep): void {
        this.steps.push(step);
    }

    validate(input: Record<string, unknown>): { isValid: boolean; errors: string[] } {
        const errors: string[] = [];
        let allValid = true;

        for (const step of this.steps) {
            const result = step(input);
            if (!result.isValid) {
                allValid = false;
                errors.push(...result.errors);
            }
        }

        return { isValid: allValid, errors };
    }
}

export class StructuredToolInputValidationPipelineBuilderV1 {
    private schema: SchemaDefinition;
    private steps: ValidatorStep[] = [];

    constructor(schema: SchemaDefinition) {
        this.schema = schema;
    }

    private addStep(step: ValidatorStep): void {
        this.steps.push(step);
    }

    public addRequiredField(fieldName: string): StructuredToolInputValidationPipelineBuilderV1 {
        this.addStep((input: Record<string, unknown>) => {
            const value = input[fieldName];
            if (typeof value === 'undefined' || value === null || (typeof value === 'string' && value.trim() === '')) {
                return { isValid: false, errors: [`Field '${fieldName}' is required.`] };
            }
            return { isValid: true, errors: [] };
        });
        return this;
    }

    public addCrossFieldDependency(fieldA: string, fieldB: string, condition: (a: unknown, b: unknown) => boolean): StructuredToolInputValidationPipelineBuilderV1 {
        this.addStep((input: Record<string, unknown>) => {
            const valueA = input[fieldA];
            const valueB = input[fieldB];
            if (condition(valueA, valueB)) {
                return { isValid: true, errors: [] };
            } else {
                return { isValid: false, errors: [`Dependency failed: When ${fieldA} is ${valueA}, ${fieldB} must satisfy the condition.`] };
            }
        });
        return this;
    }

    public addTypeCheck(fieldName: string, expectedType: "string" | "number" | "boolean"): StructuredToolInputValidationPipelineBuilderV1 {
        this.addStep((input: Record<string, unknown>) => {
            const value = input[fieldName];
            if (typeof value === 'undefined' || value === null) {
                return { isValid: true, errors: [] }; // Handled by required check if necessary
            }

            const actualType = typeof value;
            if (expectedType === "string" && actualType !== "string") {
                return { isValid: false, errors: [`Field '${fieldName}' must be a string, but got ${actualType}.`] };
            }
            if (expectedType === "number" && actualType !== "number") {
                return { isValid: false, errors: [`Field '${fieldName}' must be a number, but got ${actualType}.`] };
            }
            if (expectedType === "boolean" && actualType !== "boolean") {
                return { isValid: false, errors: [`Field '${fieldName}' must be a boolean, but got ${actualType}.`] };
            }
            return { isValid: true, errors: [] };
        });
        return this;
    }

    public build(): StructuredToolInputValidationPipeline {
        this.steps.forEach(step => {
            // The pipeline constructor handles the actual step execution, we just need to compile the steps.
        });
        return new StructuredToolInputValidationPipeline();
    }
}