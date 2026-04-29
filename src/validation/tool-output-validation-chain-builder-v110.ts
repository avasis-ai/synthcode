import { Message, ToolResultMessage } from "./types";

type Validator<T> = (output: T) => { isValid: boolean; errors: string[] };
type StepFactory<T> = (context: { input: T; message: Message }) => { validator: (output: T) => { isValid: boolean; errors: string[] }; name: string };

export class ToolOutputValidationChainBuilder {
    private steps: { validator: (output: any) => { isValid: boolean; errors: string[] }; name: string }[] = [];
    private initialContextSchema: any;

    constructor(initialContextSchema: any) {
        this.initialContextSchema = initialContextSchema;
    }

    addSchemaValidator(validator: Validator<any>): this {
        this.steps.push({
            validator: (output: any) => validator(output),
            name: "SchemaValidator"
        });
        return this;
    }

    addCustomStep(stepFactory: StepFactory<any>): this {
        const { validator, name } = stepFactory({ input: null, message: null });
        this.steps.push({ validator, name });
        return this;
    }

    build(): (output: any, context: { input: any; message: Message }) => { isValid: boolean; errors: string[] } => {
        return (output: any, context: { input: any; message: Message }): { isValid: boolean; errors: string[] } => {
            let currentOutput: any = output;
            let allErrors: string[] = [];
            let isValid = true;

            for (const step of this.steps) {
                const result = step.validator(currentOutput);
                if (!result.isValid) {
                    allErrors.push(`[${step.name}] Validation failed: ${result.errors.join('; ')}`);
                    isValid = false;
                }
                // For sequential validation, we might update the context/output based on the step,
                // but for simplicity here, we assume the validator only reads from the initial 'output'.
                // If subsequent steps needed the result of the previous one, the signature would need adjustment.
            }

            return {
                isValid: isValid && allErrors.length === 0,
                errors: allErrors
            };
        };
    }
}