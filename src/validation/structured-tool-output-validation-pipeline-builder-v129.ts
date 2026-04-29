import { Message, ToolResultMessage } from "./types";

type Validator<T> = (input: T) => { isValid: boolean; error?: string; result?: any };

interface ValidationContext {
    initialInput: any;
    history: Message[];
}

export class StructuredToolOutputValidationPipelineBuilder {
    private validators: { validator: Validator<any>; contextKey: string }[] = [];
    private context: ValidationContext;

    constructor(initialContext: ValidationContext) {
        this.context = initialContext;
    }

    public addValidator(validator: Validator<any>, contextKey: string): this {
        this.validators.push({ validator, contextKey });
        return this;
    }

    public build(): {
        validate: (input: any) => { isValid: boolean; error?: string; finalResult?: any };
        context: ValidationContext;
    } {
        const validatePipeline = (input: any): { isValid: boolean; error?: string; finalResult?: any } => {
            let currentResult: any = input;
            let lastError: string | undefined = undefined;

            for (const { validator, contextKey } of this.validators) {
                let validationInput: any;

                if (contextKey === "initial") {
                    validationInput = input;
                } else if (contextKey === "history") {
                    validationInput = this.context.history;
                } else {
                    validationInput = currentResult;
                }

                const validationResult = validator(validationInput);

                if (!validationResult.isValid) {
                    lastError = validationResult.error || "Validation failed at an unknown stage.";
                    return { isValid: false, error: lastError };
                }

                currentResult = validationResult.result || currentResult;
            }

            return { isValid: true, finalResult: currentResult };
        };

        return {
            validate: validatePipeline,
            context: this.context
        };
    }
}