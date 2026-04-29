import { Message, ToolUseBlock } from "./types";

export type ValidationResult = {
  isValid: boolean;
  errors: string[];
};

export interface ToolCallValidator {
  validate(toolCalls: ToolUseBlock[]): ValidationResult;
}

export interface ToolCallValidationChainBuilder {
  add(validator: ToolCallValidator): ToolCallValidationChainBuilder;
  build(): StructuredToolCallValidator;
}

export class StructuredToolCallValidator implements ToolCallValidator {
  private validators: ToolCallValidator[] = [];

  private constructor(validators: ToolCallValidator[]) {
    this.validators = validators;
  }

  public static createBuilder(): ToolCallValidationChainBuilder {
    return new class implements ToolCallValidationChainBuilder {
      private validators: ToolCallValidator[] = [];

      add(validator: ToolCallValidator): ToolCallValidationChainBuilder {
        this.validators.push(validator);
        return this;
      }

      build(): StructuredToolCallValidator {
        return new StructuredToolCallValidator(this.validators);
      }
    };
  }

  public validate(toolCalls: ToolUseBlock[]): ValidationResult {
    let allErrors: string[] = [];
    let isValid = true;

    for (const validator of this.validators) {
      const result = validator.validate(toolCalls);
      if (!result.isValid) {
        allErrors = allErrors.concat(result.errors);
        isValid = false;
      }
    }

    return {
      isValid: isValid,
      errors: allErrors,
    };
  }
}

export const buildToolCallValidationChain = (): ToolCallValidationChainBuilder => {
  return StructuredToolCallValidator.createBuilder();
};