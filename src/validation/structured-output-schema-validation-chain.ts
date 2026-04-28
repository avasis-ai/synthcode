import { Message, UserMessage, AssistantMessage, ToolResultMessage } from "./message-types";

export type ValidationResult = {
    isValid: boolean;
    errors: string[];
    payload: any;
};

export interface ValidationStep {
    validate(payload: any): {
        isValid: boolean;
        errors: string[];
    };
}

export class StructuredOutputValidationChain {
    private steps: ValidationStep[];
    private reportAllFailures: boolean;

    constructor(steps: ValidationStep[], reportAllFailures: boolean = false) {
        this.steps = steps;
        this.reportAllFailures = reportAllFailures;
    }

    public validate(payload: any): ValidationResult {
        const allErrors: string[] = [];
        let firstFailure: { isValid: boolean; errors: string[] } | null = null;

        for (const step of this.steps) {
            const result = step.validate(payload);
            if (!result.isValid) {
                if (firstFailure === null) {
                    firstFailure = result;
                }
                allErrors.push(...result.errors);
            }
        }

        const finalErrors = allErrors.length > 0 ? allErrors : [];

        if (this.reportAllFailures) {
            return {
                isValid: finalErrors.length === 0,
                errors: finalErrors,
                payload: payload,
            };
        } else {
            if (firstFailure) {
                return {
                    isValid: false,
                    errors: firstFailure.errors,
                    payload: payload,
                };
            }
            return {
                isValid: true,
                errors: [],
                payload: payload,
            };
        }
    }
}