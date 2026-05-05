import { Message, UserMessage, AssistantMessage, ToolResultMessage, ContentBlock, TextBlock, ToolUseBlock, ThinkingBlock } from "./types";

export type ValidationContext = {
    payload: Record<string, unknown>;
    history: Message[];
};

export interface Validator {
    validate(context: ValidationContext): { isValid: boolean; message?: string };
}

export interface ConstraintChain {
    execute(context: ValidationContext): { isValid: boolean; message?: string };
}

class ConstraintChainBuilder {
    private validators: Validator[] = [];

    addValidator(validator: Validator): this {
        this.validators.push(validator);
        return this;
    }

    build(): ConstraintChain {
        return {
            execute: (context: ValidationContext): { isValid: boolean; message?: string } => {
                for (const validator of this.validators) {
                    const result = validator.validate(context);
                    if (!result.isValid) {
                        return { isValid: false, message: result.message };
                    }
                }
                return { isValid: true };
            }
        };
    }
}

export { ConstraintChainBuilder };