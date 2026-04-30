import { Message, ToolResultMessage } from "./types";

type ValidatorFunction = (output: unknown) => { isValid: boolean; errors: string[] };

export class StructuredToolOutputValidationChainBuilderAdvancedAdvanced {
    private validators: ValidatorFunction[] = [];

    constructor() {}

    public addTypeValidator(validator: (output: unknown) => { isValid: boolean; errors: string[] }): this {
        this.validators.push(validator);
        return this;
    }

    public addBusinessLogicValidator(validator: (output: unknown) => { isValid: boolean; errors: string[] }): this {
        this.validators.push(validator);
        return this;
    }

    public addDriftValidator(validator: (output: unknown) => { isValid: boolean; errors: string[] }): this {
        this.validators.push(validator);
        return this;
    }

    public addCustomValidator(validator: (output: unknown) => { isValid: boolean; errors: string[] }): this {
        this.validators.push(validator);
        return this;
    }

    public build(): (output: unknown) => { isValid: boolean; errors: string[] } {
        return (output: unknown): { isValid: boolean; errors: string[] } => {
            let currentOutput: unknown = output;
            let allErrors: string[] = [];
            let overallValid = true;

            for (const validator of this.validators) {
                const result = validator(currentOutput);
                if (!result.isValid) {
                    allErrors.push(...result.errors);
                    overallValid = false;
                }
                // In a real scenario, subsequent validators might use the output of the previous one.
                // For simplicity matching the builder pattern, we pass the original output,
                // but we track the overall validity.
            }

            return {
                isValid: overallValid,
                errors: allErrors
            };
        };
    }
}