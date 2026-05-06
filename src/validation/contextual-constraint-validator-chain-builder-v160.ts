import { Message, UserMessage, AssistantMessage, ToolResultMessage, ContentBlock, TextBlock, ToolUseBlock, ThinkingBlock } from "./types";

export type ValidationResult = {
  isValid: boolean;
  errors: string[];
};

export interface ValidationContext {
  history: Message[];
  currentInput: Record<string, unknown>;
}

export interface ConstraintValidator {
  validate(context: ValidationContext): ValidationResult;
}

class ContextualConstraintValidatorChainBuilder {
  private validators: ConstraintValidator[] = [];

  addValidator(validator: ConstraintValidator): this {
    this.validators.push(validator);
    return this;
  }

  build(): ContextualConstraintValidatorChain {
    return new ContextualConstraintValidatorChain(this.validators);
  }
}

export class ContextualConstraintValidatorChain implements ConstraintValidator {
  private validators: ConstraintValidator[];

  constructor(validators: ConstraintValidator[]) {
    this.validators = validators;
  }

  validate(context: ValidationContext): ValidationResult {
    const allErrors: string[] = [];
    let isValid = true;

    for (const validator of this.validators) {
      const result = validator.validate(context);
      if (!result.isValid) {
        allErrors.push(...result.errors);
        isValid = false;
      }
    }

    return {
      isValid: isValid,
      errors: allErrors,
    };
  }
}

export { ContextualConstraintValidatorChainBuilder, ContextualConstraintValidatorChain };